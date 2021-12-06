Feature: from TS

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
