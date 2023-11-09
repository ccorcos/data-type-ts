export type B = "x" | "y"

export type X = {
	a: number
	b?: B
	c: null
	d: undefined
	f: boolean
	e: true
	g: "hello"
	h: 12
}

export type Y = {
	a: Array<string>
	b: [number, string, "last"]
	d: {
		a: 1
		b?: 2
	}
	e: any
	f: 1 | 2
	x: X
}
