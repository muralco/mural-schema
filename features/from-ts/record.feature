Feature: from TS

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
