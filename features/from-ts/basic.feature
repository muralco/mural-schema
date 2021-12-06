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
