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
