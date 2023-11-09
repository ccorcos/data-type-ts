import test from "ava"
import * as path from "path"
import { codegen } from "../src/codegen"

test("codegen", async t => {
	await codegen({
		sourcePath: path.join(__dirname, "../fixtures/input.ts"),
		outputPath: path.join(__dirname, "../fixtures/output.ts"),
	})
})
