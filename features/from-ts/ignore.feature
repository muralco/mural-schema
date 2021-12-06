Feature: from TS

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
