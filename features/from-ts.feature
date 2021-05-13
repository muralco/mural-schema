Feature: from TS

Scenario: String
  Given a TS file with interface Some { key: string; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const Some = {
      key: 'string',
    };
    """

Scenario: Number
  Given a TS file with interface Some { key: number; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const Some = {
      key: 'number',
    };
    """

Scenario: Boolean
  Given a TS file with interface Some { key: boolean; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const Some = {
      key: 'boolean',
    };
    """

Scenario: Null
  Given a TS file with interface Some { key: null; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const Some = {
      key: null,
    };
    """

Scenario: Optional
  Given a TS file with interface Some { key?: string; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const Some = {
      'key?': 'string',
    };
    """

Scenario: Enum
  Given a TS file with interface Some { key: 'a' | 'b'; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const Some = {
      key: '"a"|"b"',
    };
    """

Scenario: Array
  Given a TS file with interface Some { key: string[]; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const Some = {
      key: ['string'],
    };
    """

Scenario: Object
  Given a TS file with interface Some { key: { child: string; }; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const Some = {
      key: {
        child: 'string',
      },
    };
    """

Scenario: Object with non-identifier props
  Given a TS file with interface A { 'the-key': boolean; }
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      'the-key': 'boolean',
    };
    """

Scenario: Extends
  Given a TS file with
    """
    interface A { keyA: string; }
    interface B extends A { keyB: string; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      keyA: 'string',
    };

    export const B = {
      ...A,
      keyB: 'string',
    };
    """

Scenario: Union
  Given a TS file with type A = string | number;
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = 'string|number';
    """

Scenario: Intersection
  Given a TS file with
    """
    interface A { keyA: string; }
    type B = A & { keyB: string; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      keyA: 'string',
    };

    export const B = {
      ...A,
      keyB: 'string',
    };
    """

Scenario: Partial literal
  Given a TS file with
    """
    interface B { pa: Partial<{ a: string; }>; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const B = {
      pa: {
        'a?': 'string',
      },
    };
    """

Scenario: Partial reference
  Given a TS file with
    """
    interface A { keyA: string; }
    interface B { pa: Partial<A>; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      keyA: 'string',
    };

    export const B = {
      'pa/': A,
    };
    """

Scenario: Partial reference array
  Given a TS file with
    """
    interface A { keyA: string; }
    interface B { pa: Partial<A>[]; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      keyA: 'string',
    };

    export const B = {
      'pa/': [A],
    };
    """

Scenario: Partial optional
  Given a TS file with
    """
    interface A { keyA: string; }
    interface B { pa?: Partial<A>; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      keyA: 'string',
    };

    export const B = {
      'pa/?': A,
    };
    """

Scenario: Recursive partial literal
  Given a TS file with
    """
    interface B { pa: PartialPartial<{ a: { b: string; } }>; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const B = {
      pa: {
        'a?': {
          'b?': 'string',
        },
      },
    };
    """

Scenario: Recursive partial reference
  Given a TS file with
    """
    interface A { a: { b: string; } }
    interface B { pa: PartialPartial<A>; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      a: {
        b: 'string',
      },
    };

    export const B = {
      'pa//': A,
    };
    """

Scenario: Recursive partial optional
  Given a TS file with
    """
    interface A { a: { b: string; } }
    interface B { pa?: PartialPartial<A>; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      a: {
        b: 'string',
      },
    };

    export const B = {
      'pa//?': A,
    };
    """

Scenario: Parenthesis
  Given a TS file with
    """
    type A = (string | number)[];
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = ['string','number'];
    """

Scenario: Keyof
  Given a TS file with
    """
    interface A { a: string; b: string; }
    type B = keyof A;
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      a: 'string',
      b: 'string',
    };

    export const B = {
      $keyof: A,
    };
    """

Scenario: Keyof property
  Given a TS file with
    """
    interface A { a: string; b: string; }
    interface B { key: keyof A; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      a: 'string',
      b: 'string',
    };

    export const B = {
      'key:keyof': A,
    };
    """

Scenario: Keyof parenthesis array
  Given a TS file with
    """
    interface A { a: string; b: string }
    interface B { key: (keyof A)[]; }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      a: 'string',
      b: 'string',
    };

    export const B = {
      key: [{
        $keyof: A,
      }],
    };
    """

Scenario: Number union
  Given a TS file with
    """
    type A = 1 | 2;
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = '1|2';
    """

Scenario: String and null union
  Given a TS file with type A = string | null;
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = 'string|null';
    """

Scenario: Generic dictionary
  Given a TS file with
    """
    type A = { [id: string]: string };
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      $any: 'string',
    };
    """

Scenario: Record by reference
  Given a TS file with
    """
    type A = Record<string, string>;
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      $any: 'string',
    };
    """

Scenario: Record by value
  Given a TS file with
    """
    type A = Record<string, { a: string }>;
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      $any: {
        a: 'string',
      },
    };
    """

Scenario: RegEx
  Given a TS file with
    """
    type RegExType<_T> = string;
    type Email = RegExType<'@mail\\.com'>;
    """
  When generating the schema from that file with exports with options
    """
    {
      "regex": "RegExType"
    }
    """
  Then the generated schema is
    """
    export const Email = /@mail\.com/;
    """

Scenario: Custom Type
  Given a TS file with
    """
    type Email = string;
    type X = { a: Email };
    """
  When generating the schema from that file with exports with options
    """
    {
      "customTypes": ["Email"]
    }
    """
  Then the generated schema is
    """
    export const X = {
      a: 'Email',
    };
    """

Scenario: Custom Type transform (lowercase)
  Given a TS file with
    """
    type Email = string;
    type X = Email;
    """
  When generating the schema from that file with exports with options
    """
    {
      "customTypes": ["Email"],
      "customTypeTransform": "lowercase"
    }
    """
  Then the generated schema is
    """
    export const X = 'email';
    """

Scenario: Custom Type transform (camelCase)
  Given a TS file with
    """
    type AddressAndZipCode = string;
    type X = AddressAndZipCode;
    """
  When generating the schema from that file with exports with options
    """
    {
      "customTypes": ["AddressAndZipCode"],
      "customTypeTransform": "camelCase"
    }
    """
  Then the generated schema is
    """
    export const X = 'addressAndZipCode';
    """

Scenario: Custom Type transform (snake-case)
  Given a TS file with
    """
    type AddressAndZipCode = string;
    type X = AddressAndZipCode;
    """
  When generating the schema from that file with exports with options
    """
    {
      "customTypes": ["AddressAndZipCode"],
      "customTypeTransform": "snake-case"
    }
    """
  Then the generated schema is
    """
    export const X = 'address-and-zip-code';
    """

Scenario: Ignore types
  Given a TS file with
    """
    type A = string;
    type B = number;
    type X = { a: A; b: B };
    """
  When generating the schema from that file with exports with options
    """
    {
      "ignore": ["A"]
    }
    """
  Then the generated schema is
    """
    export const B = 'number';

    export const X = {
      a: A,
      b: B,
    };
    """

Scenario: Ignore interfaces
  Given a TS file with
    """
    type A = string;
    interface X = { a: A };
    """
  When generating the schema from that file with exports with options
    """
    {
      "ignore": ["X"]
    }
    """
  Then the generated schema is
    """
    export const A = 'string';
    """

Scenario: Only types
  Given a TS file with
    """
    type A = string;
    type B = number;
    type X = { a: A; b: B };
    """
  When generating the schema from that file with exports with options
    """
    {
      "only": ["B", "X"]
    }
    """
  Then the generated schema is
    """
    export const B = 'number';

    export const X = {
      a: A,
      b: B,
    };
    """

Scenario: Only interfaces
  Given a TS file with
    """
    type A = string;
    interface X = { a: A };
    """
  When generating the schema from that file with exports with options
    """
    {
      "only": ["A"]
    }
    """
  Then the generated schema is
    """
    export const A = 'string';
    """

Scenario: Generate declarations
  Given a TS file with
    """
    declare module "m" {
      export type A = string;
    }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const mA = 'string';
    """

Scenario: Generate declarations (slash, dash module)
  Given a TS file with
    """
    declare module "@util/group-by" {
      export type A = string;
    }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const utilGroupByA = 'string';
    """

Scenario: Generate only some declarations
  Given a TS file with
    """
    declare module "m" {
      export type A = string;
      export type B = string;
    }
    """
  When generating the schema from that file with exports with options
    """
    {
      "only": ["mB"]
    }
    """
  Then the generated schema is
    """
    export const mB = 'string';
    """
