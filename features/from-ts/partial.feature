Feature: from TS

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
