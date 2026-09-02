/**
 * Model representing a stored image.
 */

const { DAY_IN_SECONDS, YEAR_IN_SECONDS } = require("../config");

class Image {
  constructor({
    id,
    key,
    storage_name,
    mime,
    size_bytes,
    width,
    height,
    expires_at,
    created_at,
  }) {
    this.id = id;
    this.key = key;
    this.storage_name = storage_name;
    this.mime = mime;
    this.size_bytes = size_bytes;
    this.width = width;
    this.height = height;
    this.expires_at = expires_at;
    this.created_at = created_at;
  }

  get ttl() {
    return (this.expires_at - Date.now()) / 1000;
  }

  get ttlText() {
    const s = this.ttl;
    if (s < 0) return "expired";
    if (s < 60) return `${Math.round(s)} seconds`;
    if (s < 3600) return `${Math.round(s / 60)} minutes`;
    if (s < DAY_IN_SECONDS) return `${Math.round(s / 3600)} hours`;
    if (s < YEAR_IN_SECONDS) return `${Math.round(s / DAY_IN_SECONDS)} days`;
    return `${(s / YEAR_IN_SECONDS).toFixed(1)} years`;
  }

  get isExpired() {
    return this.ttl < 0;
  }

  get sizeText() {
    const kb = this.size_bytes / 1000;
    return kb >= 1 ? `${kb.toFixed(1)} KB` : `${Math.round(kb * 1000)} B`;
  }

  get dimensionsText() {
    return `${this.width} × ${this.height}`;
  }

  get createdAtText() {
    if (!this.created_at) return "—";
    return new Date(this.created_at).toLocaleString("en-US", {
      timeZone: "America/Toronto",
    });
  }
}

module.exports = Image;
