Feature: from TS

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
