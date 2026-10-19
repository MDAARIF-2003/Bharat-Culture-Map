import React from "react";

const INDIA_SILHOUETTE_PATH = "M 502.8,217.3 L 501.5,218.1 L 500.5,219.3 L 500.0,220.9 L 499.9,223.0 L 500.2,225.6 L 499.8,227.3 L 498.6,228.2 L 496.6,228.2 L 493.9,227.5 L 490.6,227.7 L 486.8,228.7 L 482.4,230.7 L 477.5,233.5 L 473.8,236.2 L 471.4,238.8 L 470.2,241.3 L 470.4,243.7 L 469.9,246.3 L 468.9,249.2 L 467.4,252.4 L 465.3,255.9 L 463.7,259.0 L 462.5,261.7 L 461.8,264.1 L 461.6,266.1 L 461.1,268.5 L 460.1,271.2 L 458.8,274.2 L 457.1,277.6 L 455.1,279.9 L 452.7,281.2 L 450.1,281.3 L 447.1,280.4 L 444.8,280.7 L 443.3,282.4 L 442.4,285.4 L 442.3,289.6 L 441.9,293.2 L 441.4,296.0 L 440.8,298.1 L 439.9,299.5 L 439.4,301.0 L 439.1,302.6 L 439.2,304.3 L 439.6,306.0 L 439.4,307.6 L 438.7,309.0 L 437.4,310.1 L 435.5,311.1 L 433.6,310.2 L 431.7,307.4 L 429.7,302.8 L 427.7,296.2 L 425.9,291.3 L 424.4,288.0 L 423.1,286.4 L 422.0,286.4 L 421.1,287.1 L 420.3,288.4 L 419.5,290.4 L 418.9,293.0 L 417.9,294.5 L 416.6,294.7 L 414.8,293.8 L 412.7,291.6 L 411.5,289.5 L 411.0,287.2 L 411.4,284.9 L 412.6,282.6 L 413.9,280.8 L 415.3,279.5 L 416.9,278.7 L 418.6,278.5 L 420.3,277.4 L 422.0,275.5 L 423.8,272.9 L 425.5,269.4 L 426.3,266.6 L 426.1,264.5 L 424.9,263.1 L 422.7,262.4 L 420.1,261.9 L 417.3,261.5 L 414.1,261.4 L 410.5,261.5 L 407.0,261.4 L 403.4,261.1 L 399.8,260.7 L 396.2,260.1 L 393.4,259.0 L 391.4,257.3 L 390.2,255.0 L 389.9,252.1 L 389.2,249.9 L 388.1,248.4 L 386.7,247.5 L 384.9,247.3 L 382.7,246.7 L 380.3,245.7 L 377.6,244.3 L 374.6,242.6 L 372.0,241.9 L 369.8,242.4 L 368.0,244.1 L 366.7,246.9 L 366.4,249.5 L 367.1,252.0 L 368.8,254.4 L 371.5,256.5 L 373.0,258.6 L 373.2,260.4 L 372.1,262.1 L 369.7,263.7 L 367.7,265.2 L 366.1,266.7 L 364.9,268.2 L 364.0,269.7 L 364.0,271.1 L 364.7,272.4 L 366.3,273.6 L 368.6,274.7 L 370.2,276.2 L 371.1,278.0 L 371.2,280.1 L 370.5,282.6 L 370.4,285.2 L 370.7,288.0 L 371.5,291.0 L 372.8,294.1 L 374.0,297.3 L 374.9,300.5 L 375.7,303.8 L 376.3,307.2 L 376.6,310.2 L 376.6,312.6 L 376.4,314.6 L 375.8,316.1 L 374.8,317.2 L 373.2,317.9 L 371.1,318.3 L 368.5,318.2 L 365.4,318.4 L 361.8,318.8 L 357.6,319.4 L 352.9,320.3 L 349.4,321.7 L 347.2,323.7 L 346.2,326.2 L 346.4,329.3 L 346.1,332.3 L 345.1,335.0 L 343.7,337.6 L 341.6,340.1 L 338.7,342.6 L 335.0,345.2 L 330.4,347.9 L 324.9,350.7 L 319.7,354.0 L 314.8,357.8 L 310.3,362.1 L 306.0,367.0 L 302.1,371.3 L 298.5,375.0 L 295.3,378.2 L 292.4,380.8 L 289.3,383.4 L 286.0,386.0 L 282.4,388.7 L 278.6,391.4 L 275.8,393.9 L 273.9,396.2 L 272.9,398.3 L 272.9,400.2 L 272.4,401.9 L 271.5,403.4 L 270.1,404.6 L 268.2,405.6 L 265.9,406.7 L 263.2,408.0 L 260.2,409.3 L 256.7,410.8 L 253.7,412.0 L 251.1,412.8 L 248.9,413.4 L 247.1,413.6 L 245.5,414.5 L 244.1,416.2 L 242.8,418.6 L 241.6,421.8 L 240.9,425.5 L 240.8,429.7 L 241.1,434.5 L 241.9,439.9 L 242.5,444.8 L 243.0,449.2 L 243.4,453.1 L 243.6,456.5 L 243.3,460.1 L 242.6,463.7 L 241.5,467.5 L 239.8,471.4 L 238.6,476.1 L 237.8,481.6 L 237.4,487.8 L 237.4,494.8 L 236.9,500.1 L 235.9,503.8 L 234.4,505.7 L 232.4,505.9 L 230.5,506.8 L 228.7,508.5 L 226.9,510.9 L 225.1,514.0 L 224.1,516.7 L 223.8,519.0 L 224.3,520.8 L 225.4,522.1 L 225.4,523.4 L 224.3,524.7 L 221.9,525.9 L 218.5,527.1 L 215.5,528.7 L 213.2,530.7 L 211.3,533.1 L 210.1,535.9 L 208.7,538.3 L 207.3,540.3 L 205.8,541.9 L 204.3,543.0 L 202.3,543.0 L 199.7,541.6 L 196.6,539.0 L 193.0,535.2 L 189.8,530.9 L 187.2,526.0 L 184.9,520.7 L 183.2,515.0 L 181.5,509.6 L 179.9,504.6 L 178.3,500.1 L 176.9,495.9 L 175.4,492.3 L 174.0,489.2 L 172.7,486.7 L 171.3,484.8 L 169.8,482.3 L 168.1,479.4 L 166.3,475.9 L 164.3,472.0 L 162.5,467.7 L 161.0,463.1 L 159.8,458.3 L 158.9,453.1 L 158.0,448.6 L 157.2,444.7 L 156.5,441.5 L 155.8,438.9 L 154.4,435.6 L 152.4,431.5 L 149.6,426.6 L 146.1,420.9 L 143.2,414.7 L 140.6,407.8 L 138.6,400.4 L 137.0,392.4 L 135.5,385.1 L 134.2,378.5 L 132.9,372.5 L 131.8,367.2 L 130.9,362.0 L 130.4,356.9 L 130.1,351.8 L 130.1,346.8 L 129.9,342.1 L 129.6,337.7 L 129.0,333.5 L 128.3,329.7 L 126.3,327.4 L 123.2,326.7 L 118.9,327.6 L 113.3,330.0 L 108.5,331.8 L 104.4,332.8 L 101.0,333.0 L 98.3,332.5 L 95.0,330.9 L 91.2,328.1 L 86.8,324.3 L 81.8,319.3 L 78.5,315.2 L 76.9,311.9 L 77.1,309.5 L 78.9,308.0 L 80.0,306.5 L 80.4,305.0 L 80.0,303.4 L 78.8,301.8 L 76.9,299.7 L 74.1,297.1 L 70.5,294.1 L 66.0,290.6 L 63.3,287.3 L 62.3,284.1 L 63.1,281.2 L 65.6,278.5 L 69.6,276.4 L 75.1,275.0 L 82.0,274.3 L 90.4,274.4 L 96.5,273.5 L 100.3,271.7 L 101.8,269.1 L 101.1,265.5 L 100.0,262.3 L 98.5,259.5 L 96.7,257.1 L 94.6,255.0 L 92.9,252.6 L 91.6,250.0 L 90.7,247.1 L 90.3,243.9 L 89.3,241.1 L 87.9,238.5 L 85.9,236.4 L 83.4,234.5 L 82.6,232.0 L 83.4,228.9 L 86.0,225.2 L 90.2,220.9 L 94.4,217.7 L 98.7,215.7 L 103.1,214.9 L 107.5,215.2 L 111.8,214.4 L 116.1,212.4 L 120.2,209.2 L 124.1,204.9 L 127.7,200.6 L 130.9,196.3 L 133.7,192.1 L 136.1,187.9 L 138.8,183.7 L 141.9,179.6 L 145.2,175.4 L 148.9,171.3 L 151.7,167.5 L 153.5,163.9 L 154.4,160.7 L 154.3,157.7 L 155.1,154.9 L 156.7,152.3 L 159.1,149.7 L 162.4,147.4 L 164.0,145.1 L 164.1,142.8 L 162.6,140.7 L 159.5,138.7 L 156.9,136.5 L 154.7,134.0 L 152.9,131.4 L 151.6,128.7 L 150.5,126.1 L 149.4,123.7 L 148.6,121.6 L 147.9,119.7 L 147.2,118.0 L 146.5,116.5 L 145.8,115.1 L 145.2,113.8 L 144.7,112.8 L 144.5,112.1 L 144.4,111.5 L 144.4,111.3 L 144.5,111.0 L 144.5,110.8 L 144.4,110.5 L 144.4,110.3 L 144.3,110.1 L 144.4,109.9 L 144.5,109.7 L 144.7,109.5 L 145.1,108.6 L 145.7,106.9 L 146.4,104.4 L 147.4,101.1 L 148.6,97.9 L 150.0,94.6 L 151.7,91.3 L 153.6,88.0 L 154.8,84.8 L 155.4,81.7 L 155.3,78.7 L 154.5,75.9 L 154.7,73.2 L 155.9,70.9 L 158.0,68.9 L 161.0,67.1 L 164.1,66.0 L 167.4,65.6 L 170.7,65.9 L 174.2,66.8 L 177.5,68.2 L 180.9,70.2 L 184.2,72.6 L 187.4,75.4 L 190.7,78.2 L 194.0,80.9 L 197.4,83.5 L 200.8,86.0 L 204.5,87.9 L 208.4,89.4 L 212.5,90.3 L 216.9,90.7 L 221.2,91.6 L 225.3,93.1 L 229.2,95.0 L 233.0,97.5 L 236.1,100.2 L 238.4,103.1 L 239.9,106.2 L 240.7,109.5 L 240.5,112.9 L 239.3,116.4 L 237.2,120.0 L 234.2,123.7 L 231.7,126.6 L 229.9,128.7 L 228.7,130.1 L 228.1,130.6 L 227.6,131.0 L 227.4,131.4 L 227.3,131.6 L 227.3,131.7 L 227.4,132.3 L 227.3,133.4 L 227.3,135.0 L 227.1,137.1 L 226.5,138.6 L 225.5,139.4 L 223.9,139.6 L 221.9,139.2 L 220.3,139.0 L 219.2,138.8 L 218.6,138.8 L 218.4,139.0 L 218.2,139.1 L 217.9,139.2 L 217.5,139.2 L 217.0,139.2 L 216.9,140.3 L 217.2,142.4 L 217.8,145.6 L 218.8,149.9 L 220.5,153.7 L 222.8,157.1 L 225.9,160.2 L 229.6,162.8 L 233.8,165.4 L 238.3,168.2 L 243.2,171.0 L 248.5,173.9 L 251.9,176.5 L 253.3,178.9 L 252.8,181.0 L 250.4,182.9 L 248.2,185.3 L 246.3,188.1 L 244.6,191.5 L 243.1,195.4 L 242.9,198.6 L 244.0,201.3 L 246.4,203.5 L 250.1,205.0 L 253.8,206.7 L 257.4,208.5 L 261.0,210.4 L 264.6,212.4 L 268.5,214.5 L 272.8,216.7 L 277.5,219.0 L 282.4,221.3 L 287.5,223.1 L 292.6,224.6 L 297.7,225.5 L 302.9,226.1 L 307.4,227.0 L 311.1,228.3 L 314.1,230.0 L 316.3,232.1 L 318.7,233.8 L 321.2,235.0 L 324.0,235.9 L 326.9,236.2 L 330.3,236.8 L 334.1,237.5 L 338.2,238.3 L 342.8,239.2 L 347.0,239.9 L 350.9,240.4 L 354.4,240.6 L 357.6,240.5 L 360.1,240.1 L 361.9,239.2 L 363.0,238.0 L 363.5,236.3 L 363.7,234.4 L 363.6,232.3 L 363.4,229.9 L 362.9,227.3 L 362.6,224.9 L 362.5,222.7 L 362.6,220.7 L 362.9,219.0 L 363.7,217.4 L 365.0,216.1 L 366.8,215.0 L 369.1,214.1 L 370.9,214.3 L 372.3,215.5 L 373.1,217.7 L 373.4,220.9 L 373.7,223.6 L 373.9,225.6 L 374.0,227.1 L 374.1,227.9 L 375.0,228.9 L 376.8,230.1 L 379.4,231.5 L 382.9,233.0 L 386.1,234.0 L 389.0,234.5 L 391.7,234.4 L 394.0,233.8 L 396.6,233.4 L 399.5,233.2 L 402.5,233.2 L 405.7,233.5 L 408.9,233.7 L 412.0,233.7 L 415.2,233.7 L 418.3,233.6 L 420.7,232.9 L 422.4,231.5 L 423.4,229.6 L 423.6,227.1 L 423.4,224.9 L 422.8,222.9 L 421.7,221.3 L 420.1,220.0 L 419.7,218.9 L 420.5,218.0 L 422.4,217.2 L 425.5,216.7 L 428.7,215.6 L 431.9,213.8 L 435.3,211.3 L 438.8,208.3 L 442.5,205.3 L 446.4,202.5 L 450.6,199.7 L 455.0,197.1 L 459.1,195.4 L 462.9,194.6 L 466.4,194.7 L 469.5,195.7 L 472.6,196.0 L 475.6,195.7 L 478.4,194.6 L 481.1,192.9 L 483.6,192.2 L 485.9,192.6 L 487.9,194.1 L 489.7,196.7 L 490.7,199.0 L 490.9,201.2 L 490.4,203.1 L 489.1,204.9 L 489.2,206.3 L 490.6,207.5 L 493.4,208.4 L 497.5,209.0 L 500.6,209.9 L 502.8,211.0 L 504.1,212.3 L 504.4,213.8 L 504.2,215.2 L 503.7,216.4 L 502.8,217.3 Z";

interface HeroIndiaArtworkProps {
  fieldVerifiedCount: number;
  activePlaceLabel: string;
  activePracticeLabel: string;
  isVerified: boolean;
}

export default function HeroIndiaArtwork({
  fieldVerifiedCount,
  activePlaceLabel,
  activePracticeLabel,
  isVerified,
}: HeroIndiaArtworkProps) {
  return (
    <div className="relative mx-auto h-[430px] w-full max-w-[540px] sm:h-[490px] lg:mx-0 lg:h-[540px] lg:max-w-none">
      {/* Golden Cartographic & Architectural Heritage Illustration of India */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        viewBox="0 0 560 600"
        fill="none"
        aria-label="Golden illustration of India's cultural geography and heritage"
      >
        <defs>
          <radialGradient id="heroAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef9d45" stopOpacity="0.28" />
            <stop offset="55%" stopColor="#b96844" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#10121c" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="heroGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff4db" />
            <stop offset="38%" stopColor="#f6bd6a" />
            <stop offset="75%" stopColor="#df8934" />
            <stop offset="100%" stopColor="#9c5422" />
          </linearGradient>
          <linearGradient id="heroIndiaFill" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#462928" stopOpacity="0.82" />
            <stop offset="52%" stopColor="#2c1d2e" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#192735" stopOpacity="0.84" />
          </linearGradient>
          <pattern id="heroJaali" width="18" height="18" patternUnits="userSpaceOnUse">
            <path
              d="M 9 0 L 18 9 L 9 18 L 0 9 Z"
              fill="none"
              stroke="#f5b864"
              strokeWidth="0.45"
              opacity="0.24"
            />
          </pattern>
          <clipPath id="heroIndiaClip">
            <path d={INDIA_SILHOUETTE_PATH} />
          </clipPath>
        </defs>

        {/* Soft Golden Aura Behind Subcontinent */}
        <circle cx="270" cy="305" r="265" fill="url(#heroAura)" />

        {/* Sacred Mandala & Astrolabe Rings */}
        <g stroke="url(#heroGoldGrad)" opacity="0.42">
          <circle cx="270" cy="305" r="115" strokeWidth="0.8" strokeDasharray="3 4" />
          <circle cx="270" cy="305" r="155" strokeWidth="0.8" />
          <circle cx="270" cy="305" r="195" strokeWidth="0.9" strokeDasharray="4 5" />
          <circle cx="270" cy="305" r="232" strokeWidth="0.9" />
          <circle cx="270" cy="305" r="264" strokeWidth="0.75" strokeDasharray="2 5" />
        </g>

        {/* India Geographic Silhouette with Internal Architectural & Temple Linework */}
        <path
          d={INDIA_SILHOUETTE_PATH}
          fill="url(#heroIndiaFill)"
          stroke="url(#heroGoldGrad)"
          strokeWidth="2.4"
        />

        <g clipPath="url(#heroIndiaClip)">
          <rect x="40" y="20" width="480" height="560" fill="url(#heroJaali)" />
          {/* Central Deccan & Northern Temple Shikhara / Jharokha Architectural Linework */}
          <g transform="translate(222, 290)" stroke="#fbd08e" opacity="0.46">
            <circle r="84" strokeWidth="0.9" />
            <circle r="64" strokeWidth="0.75" strokeDasharray="3 3" />
            <circle r="44" strokeWidth="0.85" />
            <path d="M -32,36 L -32,-6 Q -32,-42 0,-64 Q 32,-42 32,-6 L 32,36 Z" strokeWidth="1.1" />
            <path d="M -19,36 L -19,2 Q -19,-26 0,-42 Q 19,-26 19,2 L 19,36 Z" strokeWidth="0.85" />
            <line x1="0" y1="-64" x2="0" y2="-82" strokeWidth="1.3" />
            <circle cx="0" cy="-74" r="3.5" />
          </g>
          {/* Southern Gopuram Motif */}
          <g transform="translate(208, 428)" stroke="#fbd08e" opacity="0.46">
            <polygon points="0,-42 -26,20 26,20" strokeWidth="1.0" />
            <line x1="-18" y1="2" x2="18" y2="2" strokeWidth="0.8" />
            <line x1="-12" y1="-12" x2="12" y2="-12" strokeWidth="0.8" />
            <line x1="-6" y1="-26" x2="6" y2="-26" strokeWidth="0.8" />
          </g>
          {/* Northern Himalayan Arch Motif */}
          <g transform="translate(192, 148)" stroke="#fbd08e" opacity="0.44">
            <circle r="38" strokeWidth="0.8" strokeDasharray="2 3" />
            <path d="M -24,16 Q 0,-30 24,16 Z" strokeWidth="0.95" />
          </g>
        </g>

        {/* Connecting Cultural Constellation Arcs & Nodes */}
        <g>
          <path key="arc-0" d="M 151.7,400.7 Q 153.0,384.9 145.9,370.7" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-1" d="M 145.9,370.7 Q 139.7,364.1 131.0,361.6" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-2" d="M 131.0,361.6 Q 137.8,328.3 126.4,296.3" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-3" d="M 126.4,296.3 Q 159.8,271.1 175.3,232.2" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-4" d="M 175.3,232.2 Q 179.2,191.3 161.3,154.4" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-5" d="M 161.3,154.4 Q 166.4,134.0 160.1,113.9" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-6" d="M 160.1,113.9 Q 181.5,119.3 202.6,112.8" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-7" d="M 161.3,154.4 Q 182.4,171.9 209.5,176.0" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-8" d="M 209.5,176.0 Q 223.7,210.8 254.0,233.2" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-9" d="M 254.0,233.2 Q 265.9,250.2 284.8,258.5" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-10" d="M 284.8,258.5 Q 302.0,260.9 317.9,254.0" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-11" d="M 317.9,254.0 Q 335.5,285.8 367.0,303.8" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-12" d="M 367.0,303.8 Q 342.4,317.1 328.2,341.3" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-13" d="M 367.0,303.8 Q 401.0,281.6 418.5,244.9" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-14" d="M 418.5,244.9 Q 432.2,260.5 452.0,266.7" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-15" d="M 151.7,400.7 Q 185.7,404.1 216.5,389.3" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-16" d="M 151.7,400.7 Q 168.6,438.6 202.8,462.2" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-17" d="M 202.8,462.2 Q 185.7,484.5 182.7,512.4" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-18" d="M 202.8,462.2 Q 223.5,467.0 243.6,460.4" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-19" d="M 216.5,389.3 Q 220.1,428.6 243.6,460.4" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-20" d="M 216.5,389.3 Q 221.8,338.6 200.0,292.5" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-21" d="M 200.0,292.5 Q 196.1,258.9 175.3,232.2" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-22" d="M 200.0,292.5 Q 227.6,318.1 264.4,325.6" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-23" d="M 264.4,325.6 Q 294.1,342.4 328.2,341.3" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" /><path key="arc-24" d="M 284.8,258.5 Q 237.6,263.6 200.0,292.5" stroke="url(#heroGoldGrad)" strokeWidth="1.25" strokeDasharray="3 5" opacity="0.78" />
          <g key="node-0" transform="translate(151.7,400.7)"><circle r="11" fill="#ffd28a" opacity="0.34" /><circle r="7.2" fill="none" stroke="#ffd28a" strokeWidth="1" opacity="0.85" /><circle r="3.6" fill="#fff8eb" stroke="#ffd28a" strokeWidth="1.4" /></g><g key="node-1" transform="translate(145.9,370.7)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-2" transform="translate(131.0,361.6)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-3" transform="translate(126.4,296.3)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-4" transform="translate(175.3,232.2)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-5" transform="translate(160.1,113.9)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-6" transform="translate(202.6,112.8)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-7" transform="translate(161.3,154.4)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-8" transform="translate(209.5,176.0)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-9" transform="translate(254.0,233.2)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-10" transform="translate(284.8,258.5)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-11" transform="translate(317.9,254.0)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-12" transform="translate(200.0,292.5)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-13" transform="translate(264.4,325.6)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-14" transform="translate(367.0,303.8)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-15" transform="translate(328.2,341.3)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-16" transform="translate(418.5,244.9)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-17" transform="translate(452.0,266.7)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-18" transform="translate(216.5,389.3)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-19" transform="translate(202.8,462.2)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-20" transform="translate(182.7,512.4)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g><g key="node-21" transform="translate(243.6,460.4)"><circle r="6.5" fill="#ef9d45" opacity="0.22" /><circle r="4.2" fill="none" stroke="#ef9d45" strokeWidth="1" opacity="0.85" /><circle r="2.3" fill="#fff8eb" stroke="#ef9d45" strokeWidth="1.4" /></g>
        </g>
      </svg>

      {/* Top-Right Glassmorphic Card: LIVE CULTURE LAYER */}
      <div className="absolute right-1 top-4 z-10 w-48 rounded-2xl border border-white/12 bg-[#111522]/72 p-3.5 backdrop-blur-xl sm:right-2 sm:top-8 sm:w-52 sm:p-4">
        <div className="eyebrow text-[#efb167]">LIVE CULTURE LAYER</div>
        <div className="mt-4 flex items-end justify-between sm:mt-5">
          <span className="font-serif text-3xl text-white sm:text-4xl">
            {fieldVerifiedCount > 0 ? fieldVerifiedCount : "∞"}
          </span>
          <span className="eyebrow text-white/40">
            {fieldVerifiedCount > 0 ? "field-verified" : "not yet counted"}
          </span>
        </div>
        <p className="mt-2.5 text-[11px] leading-4 text-white/55 sm:mt-3 sm:text-xs sm:leading-5">
          Geographic discovery and community-governed documentation across India.
        </p>
      </div>

      {/* Bottom-Left Floating Card: DISCOVERY SIGNAL */}
      <div className="float-slow absolute bottom-4 left-2 z-10 w-48 rounded-2xl border border-[#ef9d45]/35 bg-[#1b1a2a]/82 p-3.5 shadow-2xl backdrop-blur-xl sm:bottom-10 sm:left-8 sm:w-52 sm:p-4">
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <span className="eyebrow text-[#efb167]">DISCOVERY SIGNAL</span>
          <span className="h-2 w-2 rounded-full bg-[#ef9d45] shadow-[0_0_16px_#ef9d45]" />
        </div>
        <div className="space-y-2.5 text-xs text-white/75 sm:space-y-3">
          <div className="flex justify-between gap-2">
            <span>Place</span>
            <span className="truncate text-[#efb167]">{activePlaceLabel}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between gap-2">
            <span>Practice</span>
            <span className="truncate text-[#efb167]">{activePracticeLabel}</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between gap-2">
            <span>Record</span>
            <span className={isVerified ? "text-[#8ed5bd]" : "text-[#efb167]"}>
              {isVerified ? "Practitioner-approved" : "Reference"}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle Restrained Pulsing Accents */}
      <span className="node-pulse pointer-events-none absolute left-[34%] top-[63%] h-3 w-3 rounded-full bg-[#ef9d45]" />
      <span
        className="node-pulse pointer-events-none absolute left-[46%] top-[44%] h-2.5 w-2.5 rounded-full bg-[#57c5a9]"
        style={{ animationDelay: ".7s" }}
      />
      <span
        className="node-pulse pointer-events-none absolute bottom-[28%] right-[24%] h-3 w-3 rounded-full bg-[#d27861]"
        style={{ animationDelay: "1.3s" }}
      />
    </div>
  );
}
