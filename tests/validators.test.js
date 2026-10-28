import { describe, test, expect } from "vitest";
import {
  validarEmail,
  validarId,
  validarNombre,
  validarPublished,
  validarTexto,
} from "../src/utils/validators.js";

// Tests unitarios: prueban las funciones solas, sin servidor ni base de datos

describe("validarId", () => {
  test("acepta números enteros positivos", () => {
    expect(validarId(1)).toBeNull();
    expect(validarId("25")).toBeNull();
  });

  test("rechaza valores que no son enteros positivos", () => {
    expect(validarId("abc")).not.toBeNull();
    expect(validarId(-1)).not.toBeNull();
    expect(validarId(0)).not.toBeNull();
    expect(validarId(1.5)).not.toBeNull();
  });
});

describe("validarNombre", () => {
  test("acepta un nombre válido", () => {
    expect(validarNombre("Ana")).toBeNull();
  });

  test("rechaza nombre faltante, vacío o que no es texto", () => {
    expect(validarNombre(undefined)).toBe("El nombre es requerido");
    expect(validarNombre("   ")).toBe("El nombre no puede estar vacío");
    expect(validarNombre(123)).toBe("El nombre debe ser un texto");
  });

  test("rechaza nombres de más de 100 caracteres", () => {
    expect(validarNombre("a".repeat(101))).toContain("100");
  });
});

describe("validarEmail", () => {
  test("acepta un email válido", () => {
    expect(validarEmail("ana@example.com")).toBeNull();
  });

  test("rechaza emails sin formato correcto", () => {
    expect(validarEmail("ana")).toBe("El formato del email es inválido");
    expect(validarEmail("ana@example")).toBe("El formato del email es inválido");
    expect(validarEmail("ana @example.com")).toBe("El formato del email es inválido");
  });

  test("rechaza email faltante", () => {
    expect(validarEmail(undefined)).toBe("El email es requerido");
  });
});

describe("validarTexto", () => {
  test("usa el nombre del campo en el mensaje", () => {
    expect(validarTexto("", "título")).toBe("El título no puede estar vacío");
  });

  test("respeta el máximo de caracteres", () => {
    expect(validarTexto("hola", "título", 3)).not.toBeNull();
    expect(validarTexto("hola", "título", 10)).toBeNull();
  });
});

describe("validarPublished", () => {
  test("es opcional y acepta booleanos", () => {
    expect(validarPublished(undefined)).toBeNull();
    expect(validarPublished(true)).toBeNull();
    expect(validarPublished(false)).toBeNull();
  });

  test("rechaza valores que no son booleanos", () => {
    expect(validarPublished("true")).not.toBeNull();
    expect(validarPublished(1)).not.toBeNull();
  });
});
