// src/lib/utils/safe-redirect.test.ts
import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps paths on this site, query and hash included", () => {
    expect(safeRedirectPath("/profile")).toBe("/profile");
    expect(safeRedirectPath("/payment/process?recurring=true")).toBe("/payment/process?recurring=true");
    expect(safeRedirectPath("/book/address?x=1#top")).toBe("/book/address?x=1#top");
    expect(safeRedirectPath("/%2F%2Fevil.example")).toBe("/%2F%2Fevil.example");
  });

  it("refuses absolute and protocol-relative URLs", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/profile");
    expect(safeRedirectPath("https://evil.example/profile")).toBe("/profile");
    expect(safeRedirectPath("//evil.example")).toBe("/profile");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/profile");
  });

  it("refuses the slash tricks browsers read as another host", () => {
    expect(safeRedirectPath("/\\evil.example")).toBe("/profile");
    expect(safeRedirectPath("/\t/evil.example")).toBe("/profile");
    expect(safeRedirectPath("/\n/evil.example")).toBe("/profile");
    expect(safeRedirectPath("/\r/evil.example")).toBe("/profile");
    expect(safeRedirectPath("\\/evil.example")).toBe("/profile");
  });

  it("refuses dot segments that collapse into //host", () => {
    // new URL("/..//evil.example", base).pathname is "//evil.example"
    expect(safeRedirectPath("/..//evil.example")).toBe("/profile");
    expect(safeRedirectPath("/.//evil.example")).toBe("/profile");
    expect(safeRedirectPath("/a/../..//evil.example")).toBe("/profile");
  });

  it("normalises harmless dot segments instead of refusing them", () => {
    expect(safeRedirectPath("/a/../profile")).toBe("/profile");
  });

  it("falls back for missing or non-string values", () => {
    expect(safeRedirectPath(null)).toBe("/profile");
    expect(safeRedirectPath(undefined)).toBe("/profile");
    expect(safeRedirectPath("")).toBe("/profile");
    expect(safeRedirectPath(new File([], "x"))).toBe("/profile");
    expect(safeRedirectPath("profile", "/payment/process")).toBe("/payment/process");
  });
});
