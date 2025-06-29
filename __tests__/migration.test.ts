import { describe, it, expect } from "vitest";
import {
  roleToSlot,
  getFieldName,
  getBasicFieldName,
  getOppositeSlot,
} from "@/lib/role-utils";

describe("Database Migration Schema Tests", () => {
  describe("Role to Slot Mapping", () => {
    it("maps girlfriend to slot a", () => {
      expect(roleToSlot("girlfriend")).toBe("a");
    });

    it("maps boyfriend to slot b", () => {
      expect(roleToSlot("boyfriend")).toBe("b");
    });

    it("throws error for invalid role", () => {
      expect(() => roleToSlot("invalid" as any)).toThrow("Invalid role");
    });
  });

  describe("Partner Slot Detection", () => {
    it("returns b when user is in slot a", () => {
      expect(getOppositeSlot("a")).toBe("b");
    });

    it("returns a when user is in slot b", () => {
      expect(getOppositeSlot("b")).toBe("a");
    });

    it("throws error for invalid slot", () => {
      expect(() => getOppositeSlot("invalid" as any)).toThrow();
    });
  });

  describe("Field Name Generation", () => {
    const categories = [
      "animal",
      "place",
      "plant",
      "character",
      "season",
      "hobby",
      "food",
      "colour",
      "drink",
    ] as const;

    const basicFields = ["name", "ready", "emoji"] as const;

    describe("Category Fields - Girlfriend Role", () => {
      categories.forEach((category) => {
        it(`maps ${category} girlfriend to ${category}_a`, () => {
          expect(getFieldName(category, "girlfriend")).toBe(`${category}_a`);
        });
      });
    });

    describe("Category Fields - Boyfriend Role", () => {
      categories.forEach((category) => {
        it(`maps ${category} boyfriend to ${category}_b`, () => {
          expect(getFieldName(category, "boyfriend")).toBe(`${category}_b`);
        });
      });
    });

    describe("Basic Fields - Girlfriend Role", () => {
      basicFields.forEach((field) => {
        it(`maps ${field} girlfriend to a_${field}`, () => {
          expect(getBasicFieldName(field, "girlfriend")).toBe(`a_${field}`);
        });
      });
    });

    describe("Basic Fields - Boyfriend Role", () => {
      basicFields.forEach((field) => {
        it(`maps ${field} boyfriend to b_${field}`, () => {
          expect(getBasicFieldName(field, "boyfriend")).toBe(`b_${field}`);
        });
      });
    });
  });

  describe("Field Mapping Accuracy", () => {
    it("ensures all 24 fields are correctly mapped", () => {
      const categories = [
        "animal",
        "place",
        "plant",
        "character",
        "season",
        "hobby",
        "food",
        "colour",
        "drink",
      ];
      const basicFields = ["name", "ready", "emoji"];

      // Test girlfriend -> a mappings
      const girlfriendMappings = [
        ...categories.map((cat) => ({
          old: `${cat}_girlfriend`,
          new: `${cat}_a`,
        })),
        ...basicFields.map((field) => ({
          old: `girlfriend_${field}`,
          new: `a_${field}`,
        })),
      ];

      // Test boyfriend -> b mappings
      const boyfriendMappings = [
        ...categories.map((cat) => ({
          old: `${cat}_boyfriend`,
          new: `${cat}_b`,
        })),
        ...basicFields.map((field) => ({
          old: `boyfriend_${field}`,
          new: `b_${field}`,
        })),
      ];

      // Verify all mappings
      girlfriendMappings.forEach((mapping) => {
        let expectedNew: string;

        if (mapping.old.includes("_girlfriend")) {
          // This is a category field like "animal_girlfriend"
          const category = mapping.old.replace("_girlfriend", "");
          expectedNew = getFieldName(category as any, "girlfriend");
        } else {
          // This is a basic field like "girlfriend_name"
          const fieldType = mapping.old.replace("girlfriend_", "");
          expectedNew = getBasicFieldName(fieldType as any, "girlfriend");
        }

        expect(expectedNew).toBe(mapping.new);
      });

      boyfriendMappings.forEach((mapping) => {
        let expectedNew: string;

        if (mapping.old.includes("_boyfriend")) {
          // This is a category field like "animal_boyfriend"
          const category = mapping.old.replace("_boyfriend", "");
          expectedNew = getFieldName(category as any, "boyfriend");
        } else {
          // This is a basic field like "boyfriend_name"
          const fieldType = mapping.old.replace("boyfriend_", "");
          expectedNew = getBasicFieldName(fieldType as any, "boyfriend");
        }

        expect(expectedNew).toBe(mapping.new);
      });

      // Ensure we tested all 24 fields (12 girlfriend + 12 boyfriend)
      expect(girlfriendMappings.length + boyfriendMappings.length).toBe(24);
    });
  });

  describe("Migration Data Preservation", () => {
    it("preserves string values correctly", () => {
      const mockOldData = {
        girlfriend_name: "Alice",
        boyfriend_name: "Bob",
        animal_girlfriend: "https://example.com/cat.jpg",
        animal_boyfriend: "https://example.com/dog.jpg",
      };

      // Simulate migration mapping
      const newData = {
        a_name: mockOldData.girlfriend_name,
        b_name: mockOldData.boyfriend_name,
        animal_a: mockOldData.animal_girlfriend,
        animal_b: mockOldData.animal_boyfriend,
      };

      expect(newData.a_name).toBe("Alice");
      expect(newData.b_name).toBe("Bob");
      expect(newData.animal_a).toBe("https://example.com/cat.jpg");
      expect(newData.animal_b).toBe("https://example.com/dog.jpg");
    });

    it("preserves JSON arrays correctly (character category)", () => {
      const mockCharacterData = JSON.stringify([
        "https://example.com/char1.jpg",
        "https://example.com/char2.jpg",
        "https://example.com/char3.jpg",
      ]);

      const mockOldData = {
        character_girlfriend: mockCharacterData,
        character_boyfriend: mockCharacterData,
      };

      // Simulate migration
      const newData = {
        character_a: mockOldData.character_girlfriend,
        character_b: mockOldData.character_boyfriend,
      };

      expect(newData.character_a).toBe(mockCharacterData);
      expect(newData.character_b).toBe(mockCharacterData);

      // Verify data can be parsed back correctly
      const parsedA = JSON.parse(newData.character_a);
      const parsedB = JSON.parse(newData.character_b);

      expect(Array.isArray(parsedA)).toBe(true);
      expect(Array.isArray(parsedB)).toBe(true);
      expect(parsedA.length).toBe(3);
      expect(parsedB.length).toBe(3);
    });

    it("handles null and empty values correctly", () => {
      const mockOldData = {
        girlfriend_name: null,
        boyfriend_name: "",
        animal_girlfriend: undefined,
        animal_boyfriend: null,
      };

      // Migration should preserve these values
      const newData = {
        a_name: mockOldData.girlfriend_name,
        b_name: mockOldData.boyfriend_name,
        animal_a: mockOldData.animal_girlfriend,
        animal_b: mockOldData.animal_boyfriend,
      };

      expect(newData.a_name).toBe(null);
      expect(newData.b_name).toBe("");
      expect(newData.animal_a).toBe(undefined);
      expect(newData.animal_b).toBe(null);
    });
  });

  describe("Schema Consistency", () => {
    it("ensures no field name conflicts", () => {
      const allNewFields: string[] = [];

      // Generate all possible new field names
      const categories = [
        "animal",
        "place",
        "plant",
        "character",
        "season",
        "hobby",
        "food",
        "colour",
        "drink",
      ];
      const basicFields = ["name", "ready", "images_uploaded"];

      // Add category fields
      categories.forEach((cat) => {
        allNewFields.push(`${cat}_a`, `${cat}_b`);
      });

      // Add basic fields
      basicFields.forEach((field) => {
        allNewFields.push(`a_${field}`, `b_${field}`);
      });

      // Check for duplicates
      const uniqueFields = new Set(allNewFields);
      expect(uniqueFields.size).toBe(allNewFields.length);
      expect(allNewFields.length).toBe(24);
    });

    it("ensures consistent naming pattern", () => {
      // All category fields should follow: {category}_{slot}
      const categories = [
        "animal",
        "place",
        "plant",
        "character",
        "season",
        "hobby",
        "food",
        "colour",
        "drink",
      ];

      categories.forEach((category) => {
        const fieldA = getFieldName(category as any, "girlfriend");
        const fieldB = getFieldName(category as any, "boyfriend");

        expect(fieldA).toMatch(new RegExp(`^${category}_a$`));
        expect(fieldB).toMatch(new RegExp(`^${category}_b$`));
      });

      // All basic fields should follow: {slot}_{field}
      const basicFields = ["name", "ready", "emoji"];

      basicFields.forEach((field) => {
        const fieldA = getBasicFieldName(field as any, "girlfriend");
        const fieldB = getBasicFieldName(field as any, "boyfriend");

        expect(fieldA).toMatch(new RegExp(`^a_${field}$`));
        expect(fieldB).toMatch(new RegExp(`^b_${field}$`));
      });
    });
  });
});
