import { describe, expect, it } from "vitest";
import { isAllowedImageUrl, isPublicHttpUrl } from "@/lib/url-safety";

describe("url safety", () => {
  it("accepts public http urls and rejects private targets", () => {
    expect(isPublicHttpUrl("https://example.com/video")).toBe(true);
    expect(isPublicHttpUrl("http://localhost:3000/private")).toBe(false);
    expect(isPublicHttpUrl("https://user:pass@example.com/image.jpg")).toBe(
      false
    );
    expect(isPublicHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("allows only configured image hosts", () => {
    expect(
      isAllowedImageUrl(
        "https://demo.supabase.co/storage/v1/object/public/avatars/a.jpg"
      )
    ).toBe(true);
    expect(
      isAllowedImageUrl("https://images.pexels.com/photos/1/example.jpg")
    ).toBe(true);
    expect(isAllowedImageUrl("https://example.com/image.jpg")).toBe(false);
  });
});
