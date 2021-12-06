Feature: from TS

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
