Feature: from TS

Scenario: Shallow indexed types
  Given a TS file with
    """
    interface A { b: { c: string; } }
    interface B { ref: A['b'] }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      b: {
        c: 'string',
      },
    };

    export const B = {
      ref: A.b,
    };
    """

Scenario: Nested indexed types
  Given a TS file with
    """
    interface A { b: { c: string; } }
    interface B { ref: A['b']['c'] }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      b: {
        c: 'string',
      },
    };

    export const B = {
      ref: A.b.c,
    };
    """

Scenario: Escaped shallow indexed types
  Given a TS file with
    """
    interface A { 'some-b': { c: string; } }
    interface B { ref: A['some-b'] }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      'some-b': {
        c: 'string',
      },
    };

    export const B = {
      ref: A['some-b'],
    };
    """

Scenario: Escaped nested indexed types
  Given a TS file with
    """
    interface A { 'some-b': { c: string; } }
    interface B { ref: A['some-b']['c'] }
    """
  When generating the schema from that file with exports
  Then the generated schema is
    """
    export const A = {
      'some-b': {
        c: 'string',
      },
    };

    export const B = {
      ref: A['some-b'].c,
    };
    """
