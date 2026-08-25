import { spawn } from "node:child_process";

/**
 * Exécute une commande externe (yt-dlp, ffmpeg, ...) et rejette si le code
 * de sortie est non nul. stdout/stderr sont capturés pour le debug.
 */
export function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string } = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `${command} ${args.join(" ")} a échoué (code ${code}):\n${stderr}`,
          ),
        );
      }
    });
  });
}
