import { ImageResponse } from "next/og";

// Exact path from the approved Valtum Studio logo.
const brandMarkPath = "M75,265 L75,443 L76,444 L162,444 L163,443 L174,443 L190,438 L203,430 L211,422 L215,416 L218,408 L218,395 L212,382 L204,373 L194,365 L141,331 L120,315 L94,290 Z M67,191 L68,203 L73,218 L79,230 L90,246 L111,266 L127,277 L145,286 L147,288 L149,288 L167,297 L169,297 L192,307 L197,308 L200,310 L217,316 L222,319 L224,319 L233,324 L235,324 L262,341 L276,355 L282,364 L287,377 L288,397 L287,398 L286,406 L282,416 L276,425 L267,434 L255,442 L253,442 L252,444 L254,443 L257,444 L375,444 L376,443 L383,443 L360,427 L344,411 L331,393 L320,371 L320,369 L317,364 L317,362 L315,359 L314,354 L305,334 L305,332 L293,309 L285,297 L273,282 L258,267 L247,258 L217,239 L190,227 L178,223 L175,223 L168,220 L165,220 L164,219 L113,207 L102,203 L99,203 L92,200 L89,200 L86,198 L81,197 Z M5,5 L5,13 L4,14 L4,20 L5,21 L5,33 L4,34 L4,72 L5,73 L5,77 L4,78 L4,101 L5,102 L5,113 L4,114 L4,154 L5,157 L4,158 L5,159 L5,168 L4,169 L4,172 L6,174 L7,173 L8,174 L13,174 L14,173 L41,173 L42,174 L64,174 L65,173 L123,173 L124,174 L168,174 L169,175 L191,176 L192,177 L198,177 L199,178 L214,180 L241,188 L264,199 L274,205 L287,215 L301,229 L312,244 L321,262 L327,283 L328,297 L329,298 L329,309 L330,310 L330,320 L331,321 L331,331 L332,332 L332,340 L333,341 L333,347 L334,348 L335,357 L342,381 L351,400 L360,413 L375,428 L385,435 L399,442 L405,444 L406,443 L404,441 L398,429 L395,419 L395,415 L394,414 L394,392 L395,391 L395,386 L403,362 L409,351 L421,334 L427,327 L445,310 L474,290 L491,281 L498,279 L508,274 L520,270 L523,270 L527,268 L542,265 L542,41 L406,41 L406,327 L404,329 L398,331 L385,332 L384,331 L379,331 L378,330 L371,329 L364,326 L355,320 L343,307 L336,294 L333,285 L332,277 L331,276 L331,271 L330,270 L328,250 L327,249 L324,232 L318,214 L310,197 L304,187 L294,173 L276,154 L255,137 L213,109 L203,101 L183,81 L171,64 L161,44 L157,30 L157,26 L156,25 L156,17 L155,16 L155,13 L152,8 L146,5 Z";

export const runtime = "edge";
export const alt = "Valtum Studio. Good ideas. Beautifully built.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "62px 72px 56px",
        backgroundColor: "#171824",
        color: "#F5F4FA",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width={71} height={58} viewBox="0 0 550 450">
            <path d={brandMarkPath} fill="#F5F4FA" fillRule="evenodd" />
          </svg>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3 }}>
            VALTUM STUDIO
          </span>
        </div>
        <span style={{ fontSize: 17, color: "#C9C8DA", letterSpacing: 2 }}>
          AUSTRALIA · WORLDWIDE
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 82, fontWeight: 700, letterSpacing: -4 }}>
          Good ideas.
        </div>
        <div
          style={{ fontSize: 82, fontWeight: 700, letterSpacing: -4, color: "#CAC6FF" }}
        >
          Beautifully built.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          borderTop: "1px solid #424154",
          paddingTop: 23,
          justifyContent: "space-between",
          color: "#C6C5D7",
          fontSize: 17,
          letterSpacing: 1
        }}
      >
        <span>SOFTWARE · PRODUCT DESIGN · CREATIVE DEVELOPMENT</span>
        <span>valtumstudio.com.au</span>
      </div>
    </div>,
    size
  );
}
