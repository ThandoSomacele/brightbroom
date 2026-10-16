// src/lib/server/s3.test.ts
import { describe, expect, it } from "vitest";
import { buildObjectUrl, parseKeyFromUrl, type StorageConfig } from "./s3";

const aws: StorageConfig = {
  bucket: "brightbroom-upload",
  region: "af-south-1",
  forcePathStyle: false,
};

const minioPath: StorageConfig = {
  ...aws,
  endpoint: "https://minio.example.co.za",
  forcePathStyle: true,
};

const minioVirtual: StorageConfig = {
  ...aws,
  endpoint: "https://minio.example.co.za",
  forcePathStyle: false,
};

const key = "profile-images/abc123-photo.jpg";

describe("AWS (no S3_ENDPOINT)", () => {
  it("builds the same URL format as before", () => {
    expect(buildObjectUrl(aws, key)).toBe(
      "https://brightbroom-upload.s3.af-south-1.amazonaws.com/profile-images/abc123-photo.jpg",
    );
  });

  it("ignores S3_FORCE_PATH_STYLE without an endpoint", () => {
    expect(buildObjectUrl({ ...aws, forcePathStyle: true }, key)).toBe(
      buildObjectUrl(aws, key),
    );
  });

  it("parses virtual-hosted URLs", () => {
    expect(parseKeyFromUrl(aws, buildObjectUrl(aws, key))).toBe(key);
  });

  it("parses path-style AWS URLs", () => {
    expect(
      parseKeyFromUrl(
        aws,
        `https://s3.af-south-1.amazonaws.com/brightbroom-upload/${key}`,
      ),
    ).toBe(key);
  });

  it("decodes encoded keys", () => {
    expect(
      parseKeyFromUrl(
        aws,
        "https://brightbroom-upload.s3.af-south-1.amazonaws.com/documents/my%20id.pdf",
      ),
    ).toBe("documents/my id.pdf");
  });

  it("rejects other buckets, other hosts and junk", () => {
    expect(
      parseKeyFromUrl(aws, `https://other-bucket.s3.af-south-1.amazonaws.com/${key}`),
    ).toBeNull();
    expect(
      parseKeyFromUrl(aws, `https://s3.af-south-1.amazonaws.com/other-bucket/${key}`),
    ).toBeNull();
    expect(parseKeyFromUrl(aws, `https://evil.example.com/brightbroom-upload/${key}`)).toBeNull();
    expect(parseKeyFromUrl(aws, `https://minio.example.co.za/brightbroom-upload/${key}`)).toBeNull();
    expect(parseKeyFromUrl(aws, "https://brightbroom-upload.s3.af-south-1.amazonaws.com/")).toBeNull();
    expect(parseKeyFromUrl(aws, "not a url")).toBeNull();
    expect(parseKeyFromUrl(aws, "")).toBeNull();
  });
});

describe("S3-compatible endpoint, path-style", () => {
  it("builds endpoint/bucket/key", () => {
    expect(buildObjectUrl(minioPath, key)).toBe(
      "https://minio.example.co.za/brightbroom-upload/profile-images/abc123-photo.jpg",
    );
  });

  it("round-trips", () => {
    expect(parseKeyFromUrl(minioPath, buildObjectUrl(minioPath, key))).toBe(key);
  });

  it("still parses URLs stored while on AWS", () => {
    expect(parseKeyFromUrl(minioPath, buildObjectUrl(aws, key))).toBe(key);
  });

  it("rejects other buckets and other hosts", () => {
    expect(
      parseKeyFromUrl(minioPath, `https://minio.example.co.za/other-bucket/${key}`),
    ).toBeNull();
    expect(
      parseKeyFromUrl(minioPath, `https://evil.example.com/brightbroom-upload/${key}`),
    ).toBeNull();
    expect(
      parseKeyFromUrl(minioPath, "https://minio.example.co.za/brightbroom-upload/"),
    ).toBeNull();
  });

  it("supports an endpoint with a port and a base path", () => {
    const cfg: StorageConfig = {
      ...minioPath,
      endpoint: "http://localhost:9000/storage",
    };
    const url = buildObjectUrl(cfg, key);
    expect(url).toBe(
      "http://localhost:9000/storage/brightbroom-upload/profile-images/abc123-photo.jpg",
    );
    expect(parseKeyFromUrl(cfg, url)).toBe(key);
    expect(
      parseKeyFromUrl(cfg, `http://localhost:9000/brightbroom-upload/${key}`),
    ).toBeNull();
  });
});

describe("S3-compatible endpoint, virtual-hosted", () => {
  it("builds bucket.endpoint-host/key", () => {
    expect(buildObjectUrl(minioVirtual, key)).toBe(
      "https://brightbroom-upload.minio.example.co.za/profile-images/abc123-photo.jpg",
    );
  });

  it("round-trips", () => {
    expect(parseKeyFromUrl(minioVirtual, buildObjectUrl(minioVirtual, key))).toBe(key);
  });

  it("also accepts the path-style form on the endpoint host", () => {
    expect(
      parseKeyFromUrl(minioVirtual, `https://minio.example.co.za/brightbroom-upload/${key}`),
    ).toBe(key);
  });

  it("rejects another bucket's subdomain", () => {
    expect(
      parseKeyFromUrl(minioVirtual, `https://other.minio.example.co.za/${key}`),
    ).toBeNull();
  });
});
