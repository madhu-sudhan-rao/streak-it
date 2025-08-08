export interface Emoji {
  id: string;              // e.g. "smiley"
  name: string;            // e.g. "Grinning Face with Big Eyes"
  native: string;          // actual emoji character e.g. "😃"
  unified: string;         // unicode codepoint string e.g. "1f603"
  keywords: string[];      // related keywords
  shortcodes: string;      // e.g. ":smiley:"
  emoticons: string[];     // shorthand emoticons e.g. ":)", "=)", "=-)"
}
