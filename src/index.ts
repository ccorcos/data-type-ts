import { difference } from "lodash"
import compact from "lodash/compact"
import isBoolean from "lodash/isBoolean"
import isEqual from "lodash/isEqual"
import isNumber from "lodash/isNumber"
import isPlainObject_ from "lodash/isPlainObject"
import isString from "lodash/isString"

export type ValidateError = {
	message: string
	path?: Array<number | string>
	children?: Array<ValidateError>
}

type ValidatorFn<T> = {
	/**
	 * Intentionally value:T and then using implements so that this type isn't bivariant.
	 * That means that `const x: Validator<string | number> = new Validator<string> wouldn't work.
	 * However, without this "function" vs a "method" here and using implements, then the above would work.
	 * Just as you can assign `const x: (number | string)[] = [1,2,3]` because Array prototype methods are bivariant.
	 */
	_validate: (value: T) => ValidateError | undefined
}

export class Validator<T> implements ValidatorFn<T> {
	constructor(args: {
		validate: (value: T) => ValidateError | undefined
		inspect: () => string
	}) {
		this.validate = args.validate as any
		this._validate = args.validate
		this.inspect = args.inspect
	}
	public value: T
	public _validate: (value: T) => ValidateError | undefined
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
				return { message: `${JSON.stringify(value)} is not an array` }
			}
			for (let i = 0; i < value.length; i++) {
				const error = inner.validate(value[i])
				if (error) {
					return { ...error, path: [i, ...(error.path || [])] }
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
				return { message: `${JSON.stringify(value)} is not an array` }
			}
			for (let i = 0; i < values.length; i++) {
				const error = values[i].validate(value[i])
				if (error) {
					return { ...error, path: [i, ...(error.path || [])] }
				}
			}
		},
		inspect: () => "[" + values.map(v => v.inspect()).join(", ") + "]",
	})
}

export function map<T>(inner: Validator<T>): Validator<{ [key: string]: T }> {
	return new Validator<{ [key: string]: T }>({
		validate: value => {
			if (!isPlainObject(value)) {
				return { message: `${JSON.stringify(value)} is not a map` }
			}
			for (const key in value) {
				const error = inner.validate(value[key])
				if (error) {
					return { ...error, path: [key, ...(error.path || [])] }
				}
			}
		},
		inspect: () => "{ [key: string]: " + inner.inspect() + " }",
	})
}

type Assert<A extends B, B> = {}

type OptionalKeys<T> = {
	[K in keyof T]-?: undefined extends T[K]
		? {} extends { [P in K]: T[K] }
			? K
			: never
		: never
}[keyof T]
type A1 = Assert<OptionalKeys<{ a: number | undefined; b?: string[] }>, "b">

type RequiredKeys<T> = Exclude<keyof Required<T>, OptionalKeys<T>>
type A2 = Assert<RequiredKeys<{ a: number | undefined; b?: string[] }>, "a">

type Simplify<T> = { [K in keyof T]: T[K] }

class Optional<T> extends Validator<T> {
	optional = true
	constructor(inner: Validator<T>) {
		const x = union(inner, undefined_)
		super({
			validate: value => x.validate(value),
			inspect: () => x.inspect(),
		})
	}
}

export function optional<T>(value: Validator<T>) {
	// return union(value, undefined_) as Optional<T>
	return new Optional(value)
}

type OptionalValidatorKeys<T> = {
	[K in keyof T]: T[K] extends Optional<any> ? K : never
}[keyof T]

type RequiredValidatorKeys<T> = Exclude<keyof T, OptionalValidatorKeys<T>>

export function object<
	T extends {
		[K: string]: Validator<any> | Optional<any>
	},
>(args: T, strict = false) {
	return new Validator<
		Simplify<
			{
				[K in RequiredValidatorKeys<T>]: T[K]["value"]
			} & {
				[K in OptionalValidatorKeys<T>]?: T[K]["value"]
			}
		>
	>({
		validate: value => {
			if (!isPlainObject(value)) {
				return { message: `${JSON.stringify(value)} is not an object` }
			}
			for (const key in args) {
				const validator = args[key]
				const isOptional = "optional" in validator
				if (!(key in value) && strict && !isOptional) {
					return {
						message: `${JSON.stringify(key)} is missing from ${JSON.stringify(
							value
						)}`,
						path: [key],
					}
				}

				const error = validator.validate(value[key as any])
				if (error) {
					return { ...error, path: [key, ...(error.path || [])] }
				}
			}

			if (strict) {
				const extras = difference(Object.keys(value), Object.keys(args))
				if (extras.length) {
					return {
						message: `${JSON.stringify(value)} contains extra keys: ${extras
							.map(k => JSON.stringify(k))
							.join(", ")}`,
					}
				}
			}
		},
		inspect: () =>
			"{ " +
			[
				...Object.keys(args).map(key => {
					const inner = args[key]
					if ("optional" in inner) return key + ":? " + args[key].inspect()
					else return key + ": " + args[key].inspect()
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

					children: errors,
				}
			}
		},
		inspect: () => values.map(v => v.inspect()).join(" | "),
	})
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
	if (error.path?.length) {
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
