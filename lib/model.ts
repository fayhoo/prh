"use strict";

import r = require("./regexp")

export class Config {
	version:number;
	rules:Rule[];

	constructor(src:raw.Config) {
		if (!src) {
			throw new Error("src is requried");
		}
		this.version = +src.version || 1;
		this.rules = (src.rules || []).map(rule => new Rule(rule));
	}

	replaceByRule(content:string) {
		this.rules.forEach(rule => {
			content = content.replace(rule.pattern, rule.expected);
		});
		return content;
	}
}

export class Rule {
	expected:string;
	pattern:RegExp;
	options:Options;
	specs:RuleSpec[];

	constructor(src:raw.Rule) {
		if (!src) {
			throw new Error("src is requried");
		}
		if (typeof src === "string") {
			src = {
				expected: <any>src
			};
		}
		this.options = new Options(this, src.options);

		this.expected = src.expected;
		if (this.expected == null) {
			throw new Error("expected is required");
		}

		this.pattern = this._patternToRegExp(src.pattern);
		if (this.pattern == null) {
			throw new Error("pattern is required");
		}

		// for JSON order
		var options = this.options;
		delete this.options;
		this.options = options;

		this.specs = (src.specs || []).map(spec => new RuleSpec(spec));

		this.check();
	}

	_patternToRegExp(pattern:any):RegExp {
		var result:RegExp;
		if (pattern == null) {
			result = r.spreadAlphaNum(this.expected);
			if (this.options.europian) {
				result = r.addBoundary(result);
			}
			return r.addDefaultFlags(result);
		}
		if (typeof pattern === "string") {
			result = r.parseRegExpString(pattern);
			if (result) {
				return r.addDefaultFlags(result);
			}
			if (this.options.europian) {
				result = r.addBoundary(pattern);
			} else {
				result = new RegExp(pattern);
			}
			return r.addDefaultFlags(result);
		}
		if (pattern instanceof Array) {
			result = r.combine.apply(null, pattern.map((p:any) => this._patternToRegExp(p)));
			return r.addDefaultFlags(result);
		}
		return result;
	}

	check() {
		this.specs.forEach(spec => {
			var result = spec.from.replace(this.pattern, this.expected);
			if (spec.to !== result) {
				throw new Error(this.expected + " spec failed. \"" + spec.from + "\", expected \"" + spec.to + "\", but got \"" + result + "\", " + this.pattern);
			}
		});
	}

	toJSON() {
		var alt:any = {};
		for (var key in this) {
			if (key.indexOf("_") === 0) {
				continue;
			}
			var value = (<any>this)[key];
			if (value instanceof RegExp) {
				alt[key] = value.toString();
				continue;
			}
			alt[key] = value;
		}
		return alt;
	}
}

export class Options {
	europian:boolean;

	constructor(rule:Rule, src:raw.Options) {
		src = src || {};
		this.europian = src.europian != null ? src.europian : false;
	}
}

export class RuleSpec {
	from:string;
	to:string;

	constructor(src:raw.RuleSpec) {
		if (!src) {
			throw new Error("src is requried");
		}
		if (!src.from) {
			throw new Error("from is requried");
		}
		if (!src.to) {
			throw new Error("to is requried");
		}
		this.from = src.from;
		this.to = src.to;
	}
}

export module raw {
	"use strict";

	export interface Config {
		version: number;
		rules: any[]; // (string | Rule)[]
	}
	export interface Rule {
		expected: string;
		pattern?: string; // string | regexp style string
		options?: Options;
		specs?: RuleSpec[];
	}
	export interface Options {
		europian?: boolean;
	}
	export interface RuleSpec {
		from: string;
		to: string;
	}
}
