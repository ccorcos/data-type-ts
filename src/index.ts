import { difference } from "lodash"
import compact from "lodash/compact"
import isBoolean from "lodash/isBoolean"
import isEqual from "lodash/isEqual"
import isNumber from "lodash/isNumber"
import isPlainObject_ from "lodash/isPlainObject"
import isString from "lodash/isString"

export type ValidateError = {
	message: string
	path: Array<number | string>
	children?: Array<ValidateError>
}

export class Validator<T> {
	constructor(args: {
		validate: (value: T) => ValidateError | undefined
		inspect: () => string
	}) {
		this.validate = args.validate as any
		this.inspect = args.inspect
	}
	public value: T
	public validate: (value: unknown) => ValidateError | undefined
	public inspect: () => string

	toString() {
		return this.inspect()
	}

	public is(value: unknown): value is T {
		return this.validate(value as any) === undefined
	}
}

export const undefined_ = new Validator<undefined>({
	validate: value => {
		if (value !== undefined) {
			return {
				message: `${JSON.stringify(value)} is not undefined`,
				path: [],
			}
		}
	},
	inspect: () => "undefined",
})

export const null_ = new Validator<null>({
	validate: value => {
		if (value !== null) {
			return {
				message: `${JSON.stringify(value)} is not null`,
				path: [],
			}
		}
	},
	inspect: () => "null",
})

export const string = new Validator<string>({
	validate: value => {
		if (!isString(value)) {
			return {
				message: `${JSON.stringify(value)} is not a string`,
				path: [],
			}
		}
	},
	inspect: () => "string",
})

export const number = new Validator<number>({
	validate: value => {
		if (!isNumber(value)) {
			return {
				message: `${JSON.stringify(value)} is not a number`,
				path: [],
			}
		}
	},
	inspect: () => "number",
})

export const boolean = new Validator<boolean>({
	validate: value => {
		if (!isBoolean(value)) {
			return {
				message: `${JSON.stringify(value)} is not a boolean`,
				path: [],
			}
		}
	},
	inspect: () => "boolean",
})

export function literal<T extends string | number | boolean>(inner: T) {
	return new Validator<T>({
		validate: value => {
			if (!isEqual(value, inner)) {
				return {
					message: `${JSON.stringify(value)} is not ${JSON.stringify(inner)}`,
					path: [],
				}
			}
		},
		inspect: () => JSON.stringify(inner),
	})
}

export function array<T>(inner: Validator<T>) {
	return new Validator<Array<T>>({
		validate: value => {
			if (!Array.isArray(value)) {
				return {
					message: `${JSON.stringify(value)} is not an array`,
					path: [],
				}
			}
			for (let i = 0; i < value.length; i++) {
				const error = inner.validate(value[i])
				if (error) {
					return {
						...error,
						path: [i, ...error.path],
					}
				}
			}
		},
		inspect: () => "Array<" + inner.inspect() + ">",
	})
}

// Apparently there's a special case in TypeScript for mapping over tuples.
// https://github.com/Microsoft/TypeScript/issues/25947#issuecomment-407930249
export function tuple<T extends Array<any>>(
	...values: {
		[K in keyof T]: Validator<T[K]>
	}
) {
	return new Validator<T>({
		validate: value => {
			if (!Array.isArray(value)) {
				return {
					message: `${JSON.stringify(value)} is not an array`,
					path: [],
				}
			}
			for (let i = 0; i < values.length; i++) {
				const error = values[i].validate(value[i])
				if (error) {
					return {
						...error,
						path: [i, ...error.path],
					}
				}
			}
		},
		inspect: () => "[" + values.map(v => v.inspect()).join(", ") + "]",
	})
}

export function map<T>(inner: Validator<T>) {
	return new Validator<{ [key: string]: T }>({
		validate: value => {
			if (!isPlainObject(value)) {
				return {
					message: `${JSON.stringify(value)} is not a map`,
					path: [],
				}
			}
			for (const key in value) {
				const error = inner.validate(value[key])
				if (error) {
					return {
						...error,
						path: [key, ...error.path],
					}
				}
			}
		},
		inspect: () => "{ [key: string]: " + inner.inspect() + " }",
	})
}

export function object<T extends object>(
	args: {
		[K in keyof T]: Validator<T[K]>
	},
	strict = false
) {
	return new Validator<T>({
		validate: value => {
			if (!isPlainObject(value)) {
				return {
					message: `${JSON.stringify(value)} is not an object`,
					path: [],
				}
			}
			for (const key in args) {
				const error = args[key].validate(value[key])
				if (error) {
					return {
						...error,
						path: [key, ...error.path],
					}
				}
			}

			if (strict) {
				const extras = difference(Object.keys(value), Object.keys(args))
				if (extras.length) {
					return {
						message: `${JSON.stringify(value)} contains extra keys: ${extras
							.map(k => JSON.stringify(k))
							.join(", ")}`,
						path: [],
					}
				}
			}
		},
		inspect: () =>
			"{ " +
			[
				...Object.keys(args).map(key => {
					return key + ": " + args[key].inspect()
				}),
			].join("; ") +
			" }",
	})
}

export const any = new Validator<any>({
	validate: value => undefined,
	inspect: () => "any",
})

/** This is the only one that doesn't infer well. Generic type is an array. */
export function union<T extends Validator<any>[]>(...values: T) {
	return new Validator<T[number]["value"]>({
		validate: value => {
			const errors = compact(
				values.map(possibleValidator => {
					return possibleValidator.validate(value)
				})
			)
			if (errors.length === values.length) {
				// TODO: find discriminating keys so we can report just one message.
				return {
					message: `${JSON.stringify(value)} must satisfy one of:`,
					path: [],
					children: errors,
				}
			}
		},
		inspect: () => values.map(v => v.inspect()).join(" | "),
	})
}

export function optional<T>(value: Validator<T>) {
	return union(value, undefined_)
}

function isPlainObject(obj: unknown): obj is object {
	return isPlainObject_(obj)
}

function pathToString(path: Array<string | number>) {
	return path
		.map(item => {
			if (isNumber(item)) {
				return `[${item}]`
			}
			if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(item)) {
				return `.${item}`
			}
			return `[${JSON.stringify(item)}]`
		})
		.join("")
}

function indent(str: string) {
	return "  " + str.split("\n").join("\n  ")
}

export function formatError(error: ValidateError) {
	let str = ""
	if (error.path.length) {
		str += pathToString(error.path)
		str += ": "
	}
	str += error.message
	if (error.children) {
		str += "\n"
		str += indent(error.children.map(formatError).join("\n"))
	}
	return str
}
