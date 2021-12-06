Feature: from TS

Background:
  Given config options with
    """
    {
      "imports": ["./file"],
      "useExport": true
    }
    """

Scenario: Unused import
  Given a TS file with
    """
    import { SomeType } from './file';
    interface A {
      x: string;
    }
    """
  When generating the schema from that file
  Then the generated schema is
    """
    export const A = {
      x: 'string',
    };
    """

Scenario: Regular import
  Given a TS file with
    """
    import { SomeType } from './file';
    interface A {
      x: SomeType;
    }
    """
  When generating the schema from that file
  Then the generated schema is
    """
    import { SomeType } from './file';
    export const A = {
      x: SomeType,
    };
    """

Scenario: Alias import
  Given a TS file with
    """
    import { SomeType as X } from './file';
    interface A {
      x: X;
    }
    """
  When generating the schema from that file
  Then the generated schema is
    """
    import { SomeType as X } from './file';
    export const A = {
      x: X,
    };
    """

Scenario: Some unused imports
  Given a TS file with
    """
    import { A as X, B, C } from './file';
    interface A {
      b: B;
    }
    """
  When generating the schema from that file
  Then the generated schema is
    """
    import { B } from './file';
    export const A = {
      b: B,
    };
    """

Scenario: Multiple imports
  Given a TS file with
    """
    import { A as X, B, C as Y, D } from './file';
    interface A {
      a: X;
      b: B;
      c: Y;
      d: D;
    }
    """
  When generating the schema from that file
  Then the generated schema is
    """
    import { A as X, B, C as Y, D } from './file';
    export const A = {
      a: X,
      b: B,
      c: Y,
      d: D,
    };
    """

Scenario: Selective imports (via option, './other-file' is not included)
  Given a TS file with
    """
    import { B } from './file';
    import { C } from './other-file';
    interface A {
      b: B;
      c: C;
    }
    """
  When generating the schema from that file
  Then the generated schema is
    """
    import { B } from './file';
    export const A = {
      b: B,
      c: C,
    };
    """

Scenario: Import alias
  Given a TS file with
    """
    import { B } from './file';
    interface A {
      b: B;
    }
    """
  When generating the schema from that file with options
    """
    {
      "imports": ["./file:./schemas/file"],
      "useExport": true
    }
    """
  Then the generated schema is
    """
    import { B } from './schemas/file';
    export const A = {
      b: B,
    };
    """
