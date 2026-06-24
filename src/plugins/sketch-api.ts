import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { isValidSlug } from "../../scripts/lib/slug";
import { getGitUserName } from "../../scripts/lib/git";
import { today } from "../../scripts/lib/date";
import {
  SKETCH_TYPES,
  type SketchType,
} from "../../scripts/lib/meta";
import {
  sketchDir,
  sketchCodePath,
  metaPath,
  SKETCHES_DIR,
  SKETCH_TEMPLATES,
  EXTRA_TEMPLATES,
} from "../../scripts/lib/paths";
import { readMeta, writeMeta } from "../../scripts/lib/meta-io";
import { editSketch } from "../../scripts/lib/edit-sketch-op";
import {
  readTagRegistry,
  writeTagRegistry,
  mergeTags,
  normaliseTags,
} from "../../scripts/lib/tags";

function json(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function ok(res: ServerResponse) {
  json(res, 200, { ok: true });
}

function err(res: ServerResponse, status: number, message: string) {
  json(res, status, { ok: false, error: message });
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

export function sketchApi(): Plugin {
  return {
    name: "sketch-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        const method = req.method ?? "";

        // GET /api/tags — fetch tag registry
        if (method === "GET" && url === "/api/tags") {
          return json(res, 200, readTagRegistry());
        }

        // POST /api/sketches — create
        if (method === "POST" && url === "/api/sketches") {
          try {
            const body = (await readBody(req)) as Record<string, unknown>;
            const name = typeof body.name === "string" ? body.name.trim() : "";
            const id = typeof body.id === "string" ? body.id.trim() : "";
            const type = body.type as string;
            const rawTags = Array.isArray(body.tags) ? (body.tags as string[]) : [];

            if (!name) return err(res, 400, "name is required");
            if (!id) return err(res, 400, "id is required");
            if (!isValidSlug(id))
              return err(res, 400, "invalid id: must be kebab-case slug");
            if (!(SKETCH_TYPES as readonly string[]).includes(type))
              return err(res, 400, "invalid type");

            for (const tag of rawTags) {
              if (/\s/.test(String(tag).trim()))
                return err(res, 400, `tag '${tag}' must be a single word (no spaces)`);
            }
            const tags = normaliseTags(rawTags);

            const dir = sketchDir(id);
            if (fs.existsSync(dir))
              return err(res, 400, `sketch '${id}' already exists`);

            let createdBy: string;
            try {
              createdBy = getGitUserName();
            } catch {
              createdBy = "unknown";
            }

            const date = today();
            const meta = {
              id,
              name,
              dateCreated: date,
              dateUpdated: date,
              createdBy,
              lastUpdatedBy: createdBy,
              type: type as SketchType,
              tags,
            };

            fs.mkdirSync(dir, { recursive: true });
            fs.copyFileSync(SKETCH_TEMPLATES[type as SketchType], sketchCodePath(id));
            for (const { tmpl, dest } of EXTRA_TEMPLATES[type as SketchType] ?? []) {
              fs.copyFileSync(tmpl, `${dir}/${dest}`);
            }
            writeMeta(id, meta);
            writeTagRegistry(mergeTags(readTagRegistry(), tags));
            return ok(res);
          } catch (e) {
            return err(res, 500, e instanceof Error ? e.message : "Unknown error");
          }
        }

        // POST /api/sketches/:sourceId/duplicate
        const dupMatch = url.match(/^\/api\/sketches\/([^/]+)\/duplicate$/);
        if (method === "POST" && dupMatch) {
          const sourceId = dupMatch[1]!;
          try {
            const body = (await readBody(req)) as Record<string, unknown>;
            const name = typeof body.name === "string" ? body.name.trim() : "";
            const id = typeof body.id === "string" ? body.id.trim() : "";

            if (!name) return err(res, 400, "name is required");
            if (!id) return err(res, 400, "id is required");
            if (!isValidSlug(id))
              return err(res, 400, "invalid id: must be kebab-case slug");

            const sourceDir = sketchDir(sourceId);
            if (!fs.existsSync(sourceDir))
              return err(res, 400, `source sketch '${sourceId}' not found`);

            const destDir = sketchDir(id);
            if (fs.existsSync(destDir))
              return err(res, 400, `sketch '${id}' already exists`);

            const sourceMeta = readMeta(sourceId);
            const rawTags = Array.isArray(body.tags)
              ? (body.tags as string[])
              : sourceMeta.tags ?? [];

            for (const tag of rawTags) {
              if (/\s/.test(String(tag).trim()))
                return err(res, 400, `tag '${tag}' must be a single word (no spaces)`);
            }
            const tags = normaliseTags(rawTags);

            let createdBy: string;
            try {
              createdBy = getGitUserName();
            } catch {
              createdBy = "unknown";
            }

            const date = today();
            const meta = {
              id,
              name,
              dateCreated: date,
              dateUpdated: date,
              createdBy,
              lastUpdatedBy: createdBy,
              type: sourceMeta.type,
              tags,
            };

            fs.cpSync(sourceDir, destDir, { recursive: true });
            writeMeta(id, meta);
            writeTagRegistry(mergeTags(readTagRegistry(), tags));
            return ok(res);
          } catch (e) {
            return err(res, 500, e instanceof Error ? e.message : "Unknown error");
          }
        }

        // PATCH /api/sketches/:id — edit
        const patchMatch = url.match(/^\/api\/sketches\/([^/]+)$/);
        if (method === "PATCH" && patchMatch) {
          const id = patchMatch[1]!;
          try {
            const body = (await readBody(req)) as Record<string, unknown>;
            const name = typeof body.name === "string" ? body.name.trim() : "";
            const type = body.type as string;
            const newId =
              typeof body.newId === "string" ? body.newId.trim() : undefined;
            const rawTags = Array.isArray(body.tags) ? (body.tags as string[]) : [];

            if (!name) return err(res, 400, "name is required");
            if (!(SKETCH_TYPES as readonly string[]).includes(type))
              return err(res, 400, "invalid type");
            if (newId !== undefined && !isValidSlug(newId))
              return err(res, 400, "invalid newId: must be kebab-case slug");

            for (const tag of rawTags) {
              if (/\s/.test(String(tag).trim()))
                return err(res, 400, `tag '${tag}' must be a single word (no spaces)`);
            }
            const tags = normaliseTags(rawTags);

            editSketch({ id, name, newId, type: type as SketchType, tags });
            writeTagRegistry(mergeTags(readTagRegistry(), tags));
            return ok(res);
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Unknown error";
            const status = msg.includes("not found") ? 400 : msg.includes("already exists") ? 400 : 500;
            return err(res, status, msg);
          }
        }

        // DELETE /api/sketches/:id
        if (method === "DELETE" && patchMatch) {
          const id = patchMatch[1]!;
          try {
            const dir = sketchDir(id);
            if (!fs.existsSync(dir))
              return err(res, 400, `sketch '${id}' not found`);
            fs.rmSync(dir, { recursive: true, force: true });
            return ok(res);
          } catch (e) {
            return err(res, 500, e instanceof Error ? e.message : "Unknown error");
          }
        }

        next();
      });

      // Watch sketch code files and stamp dateUpdated / lastUpdatedBy on save.
      // meta.json writes are excluded so our own writeMeta calls don't re-trigger.
      server.watcher.add(SKETCHES_DIR);
      server.watcher.on("change", (filePath) => {
        if (!filePath.startsWith(SKETCHES_DIR + path.sep)) return;
        const parts = path.relative(SKETCHES_DIR, filePath).split(path.sep);
        if (parts.length < 2) return;
        const [id, file] = parts;
        if (file === "meta.json" || !fs.existsSync(metaPath(id!))) return;
        try {
          const meta = readMeta(id!);
          let updatedBy: string;
          try { updatedBy = getGitUserName(); } catch { updatedBy = "unknown"; }
          writeMeta(id!, { ...meta, dateUpdated: today(), lastUpdatedBy: updatedBy });
        } catch {
          // Don't crash the dev server on meta update failure
        }
      });
    },
  };
}
