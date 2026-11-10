import React from "react";

export function getCityLandmarkSvg(cityName: string, strokeColor = "currentColor") {
  const norm = cityName.toLowerCase().trim();

  // 1. Delhi: India Gate, Qutub Minar & Lotus Temple
  if (norm.includes("delhi") || norm.includes("noida") || norm.includes("gurugram") || norm.includes("faridabad") || norm.includes("ghaziabad")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        {/* Ground Line */}
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        
        {/* Qutub Minar on Left */}
        <g stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.65">
          <path d="M55 165 L65 40 L70 40 L80 165 Z" fill="none" />
          <line x1="61" y1="135" x2="74" y2="135" />
          <line x1="63" y1="105" x2="72" y2="105" />
          <line x1="65" y1="75" x2="70" y2="75" />
          <path d="M66 40 L67.5 25 L69 40" />
          <circle cx="67.5" cy="22" r="2" />
        </g>

        {/* Lotus Temple Petals behind India Gate */}
        <g stroke={strokeColor} strokeWidth="1" strokeOpacity="0.45">
          <path d="M120 165 C130 110, 150 90, 160 165" />
          <path d="M135 165 C145 100, 155 100, 165 165" />
          <path d="M150 165 C160 90, 180 110, 190 165" />
        </g>

        {/* India Gate (Center Main) */}
        <g stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.75">
          {/* Base Steps */}
          <rect x="200" y="155" width="120" height="10" rx="1" />
          <rect x="208" y="148" width="104" height="7" rx="1" />
          {/* Main Pillars */}
          <rect x="215" y="80" width="28" height="68" />
          <rect x="277" y="80" width="28" height="68" />
          {/* Central Archway */}
          <path d="M243 148 L243 110 C243 92, 277 92, 277 110 L277 148" />
          {/* Upper Entablature */}
          <rect x="210" y="65" width="100" height="15" />
          <line x1="210" y1="72" x2="310" y2="72" strokeWidth="0.8" />
          {/* Attic / Top Pavilion */}
          <rect x="220" y="45" width="80" height="20" />
          <rect x="232" y="32" width="56" height="13" />
          <path d="M245 32 L260 22 L275 32 Z" />
          {/* Decorative Relief lines */}
          <line x1="229" y1="88" x2="229" y2="140" strokeWidth="0.8" strokeDasharray="3 2" />
          <line x1="291" y1="88" x2="291" y2="140" strokeWidth="0.8" strokeDasharray="3 2" />
        </g>

        {/* Distant Red Fort Chhatris on Right */}
        <g stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.55">
          <rect x="330" y="115" width="45" height="50" />
          <path d="M340 115 C340 102, 365 102, 365 115" />
          <line x1="352.5" y1="102" x2="352.5" y2="92" />
          <circle cx="352.5" cy="90" r="1.5" />
        </g>
      </svg>
    );
  }

  // 2. Mumbai: Gateway of India & Bandra-Worli Sea Link
  if (norm.includes("mumbai") || norm.includes("thane") || norm.includes("kalyan") || norm.includes("pune") || norm.includes("nashik")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        
        {/* Sea Link Cable-stayed Bridge on Left */}
        <g stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.5">
          {/* Main Pylon */}
          <path d="M60 165 L90 35 L98 35 L128 165" />
          <line x1="94" y1="35" x2="94" y2="165" strokeWidth="1.5" />
          {/* Stay Cables */}
          <line x1="94" y1="55" x2="45" y2="165" strokeWidth="0.8" />
          <line x1="94" y1="75" x2="30" y2="165" strokeWidth="0.8" />
          <line x1="94" y1="95" x2="15" y2="165" strokeWidth="0.8" />
          <line x1="94" y1="55" x2="143" y2="165" strokeWidth="0.8" />
          <line x1="94" y1="75" x2="158" y2="165" strokeWidth="0.8" />
          <line x1="94" y1="95" x2="173" y2="165" strokeWidth="0.8" />
        </g>

        {/* Gateway of India on Right */}
        <g stroke={strokeColor} strokeWidth="1.4" strokeOpacity="0.75">
          {/* Turrets and Base */}
          <rect x="210" y="155" width="150" height="10" rx="1" />
          {/* Left Turret */}
          <rect x="220" y="65" width="24" height="90" />
          <path d="M220 65 C220 50, 244 50, 244 65 Z" />
          {/* Right Turret */}
          <rect x="326" y="65" width="24" height="90" />
          <path d="M326 65 C326 50, 350 50, 350 65 Z" />
          {/* Center Structure */}
          <rect x="244" y="75" width="82" height="80" />
          {/* Grand Central Arch */}
          <path d="M262 155 L262 110 C262 90, 308 90, 308 110 L308 155" />
          {/* Center Grand Dome */}
          <path d="M260 75 C260 40, 310 40, 310 75" />
          <line x1="285" y1="40" x2="285" y2="28" strokeWidth="1.2" />
          <circle cx="285" cy="26" r="2" />
          {/* Parapet Details */}
          <line x1="244" y1="70" x2="326" y2="70" strokeWidth="1" />
        </g>
      </svg>
    );
  }

  // 3. Agra: Taj Mahal
  if (norm.includes("agra")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        {/* Left Minaret */}
        <g stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.6">
          <path d="M70 165 L76 40 L82 40 L88 165 Z" />
          <circle cx="79" cy="35" r="3" />
        </g>
        {/* Right Minaret */}
        <g stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.6">
          <path d="M312 165 L318 40 L324 40 L330 165 Z" />
          <circle cx="321" cy="35" r="3" />
        </g>
        {/* Taj Mahal Main Mausoleum */}
        <g stroke={strokeColor} strokeWidth="1.4" strokeOpacity="0.75">
          <rect x="120" y="152" width="160" height="13" />
          <rect x="135" y="85" width="130" height="67" />
          {/* Central Iwan Arch */}
          <path d="M175 152 L175 110 C175 95, 225 95, 225 110 L225 152" />
          {/* Side Arches */}
          <path d="M145 140 L145 125 C145 118, 160 118, 160 125 L160 140" strokeWidth="0.9" />
          <path d="M240 140 L240 125 C240 118, 255 118, 255 125 L255 140" strokeWidth="0.9" />
          {/* Grand Onion Dome */}
          <path d="M170 85 C165 45, 200 20, 200 20 C200 20, 235 45, 230 85 Z" />
          <line x1="200" y1="20" x2="200" y2="10" strokeWidth="1.2" />
          <circle cx="200" cy="8" r="2" />
          {/* Flanking Small Chhatris */}
          <path d="M148 85 C148 70, 162 70, 162 85" strokeWidth="1" />
          <path d="M238 85 C238 70, 252 70, 252 85" strokeWidth="1" />
        </g>
      </svg>
    );
  }

  // 4. Jaipur / Rajasthan: Hawa Mahal
  if (norm.includes("jaipur") || norm.includes("jodhpur") || norm.includes("udaipur") || norm.includes("kota")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        {/* Hawa Mahal Tiered Pyramidal Jharokhas */}
        <g stroke={strokeColor} strokeWidth="1.3" strokeOpacity="0.75">
          {/* Tier 1 Base */}
          <rect x="110" y="135" width="180" height="30" />
          {/* Tier 2 */}
          <rect x="125" y="105" width="150" height="30" />
          {/* Tier 3 */}
          <rect x="145" y="75" width="110" height="30" />
          {/* Tier 4 */}
          <rect x="165" y="50" width="70" height="25" />
          {/* Tier 5 Crown */}
          <path d="M180 50 C180 30, 220 30, 220 50 Z" />
          <line x1="200" y1="30" x2="200" y2="20" />
          <circle cx="200" cy="18" r="2" />
          {/* Windows / Lattice Jharokhas Grid */}
          {[130, 155, 180, 205, 230, 255].map((x, i) => (
            <path key={i} d={`M${x} 155 C${x} 145, ${x + 14} 145, ${x + 14} 155`} strokeWidth="0.8" />
          ))}
          {[140, 165, 190, 215, 240].map((x, i) => (
            <path key={i} d={`M${x} 125 C${x} 115, ${x + 14} 115, ${x + 14} 125`} strokeWidth="0.8" />
          ))}
          {[155, 180, 205, 230].map((x, i) => (
            <path key={i} d={`M${x} 95 C${x} 85, ${x + 14} 85, ${x + 14} 95`} strokeWidth="0.8" />
          ))}
        </g>
      </svg>
    );
  }

  // 5. Kolkata: Victoria Memorial & Howrah Bridge
  if (norm.includes("kolkata") || norm.includes("howrah") || norm.includes("patna")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        {/* Howrah Bridge Truss on Left */}
        <g stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.5">
          <path d="M25 165 L60 65 L95 165" />
          <line x1="60" y1="65" x2="60" y2="165" />
          <line x1="25" y1="120" x2="95" y2="120" strokeWidth="0.8" />
          <line x1="25" y1="165" x2="60" y2="120" strokeWidth="0.8" />
          <line x1="95" y1="165" x2="60" y2="120" strokeWidth="0.8" />
        </g>
        {/* Victoria Memorial on Right */}
        <g stroke={strokeColor} strokeWidth="1.3" strokeOpacity="0.75">
          <rect x="150" y="145" width="220" height="20" />
          <rect x="175" y="105" width="170" height="40" />
          {/* Main Grand Dome */}
          <path d="M230 105 C230 55, 290 55, 290 105" />
          <line x1="260" y1="55" x2="260" y2="38" strokeWidth="1.2" />
          <circle cx="260" cy="35" r="3" />
          {/* Colonnade Columns */}
          {[190, 210, 230, 250, 270, 290, 310, 330].map((cx, i) => (
            <line key={i} x1={cx} y1="110" x2={cx} y2="145" strokeWidth="0.9" />
          ))}
          {/* Corner Domes */}
          <path d="M180 105 C180 90, 198 90, 198 105" />
          <path d="M322 105 C322 90, 340 90, 340 105" />
        </g>
      </svg>
    );
  }

  // 6. Hyderabad: Charminar
  if (norm.includes("hyderabad") || norm.includes("warangal")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        <g stroke={strokeColor} strokeWidth="1.4" strokeOpacity="0.75">
          {/* Base */}
          <rect x="140" y="150" width="120" height="15" />
          {/* 4 Iconic Minarets (Front 2 and rear hints) */}
          <rect x="145" y="45" width="16" height="105" />
          <path d="M145 45 C145 30, 161 30, 161 45" />
          <circle cx="153" cy="26" r="2.5" />
          <rect x="239" y="45" width="16" height="105" />
          <path d="M239 45 C239 30, 255 30, 255 45" />
          <circle cx="247" cy="26" r="2.5" />
          {/* Main Arched Pavilion */}
          <rect x="161" y="80" width="78" height="70" />
          {/* Grand Arch */}
          <path d="M175 150 L175 110 C175 92, 225 92, 225 110 L225 150" />
          {/* Upper Gallery */}
          <rect x="161" y="65" width="78" height="15" />
          <path d="M185 65 C185 52, 215 52, 215 65" />
        </g>
      </svg>
    );
  }

  // 7. Bengaluru: Vidhana Soudha
  if (norm.includes("bengaluru") || norm.includes("mysuru") || norm.includes("mangaluru")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        <g stroke={strokeColor} strokeWidth="1.3" strokeOpacity="0.75">
          {/* Base Steps */}
          <rect x="90" y="152" width="220" height="13" />
          <rect x="110" y="105" width="180" height="47" />
          {/* Grand Central Dravidian Dome */}
          <path d="M175 105 C175 50, 225 50, 225 105" />
          <line x1="200" y1="50" x2="200" y2="32" strokeWidth="1.4" />
          {/* Lion Capital emblem */}
          <circle cx="200" cy="28" r="3.5" />
          {/* Colonnade Pillars */}
          {[130, 150, 170, 190, 210, 230, 250, 270].map((x, i) => (
            <line key={i} x1={x} y1="112" x2={x} y2="152" strokeWidth="0.9" />
          ))}
          {/* Corner Chhatris */}
          <rect x="115" y="85" width="20" height="20" />
          <path d="M115 85 C115 72, 135 72, 135 85" />
          <rect x="265" y="85" width="20" height="20" />
          <path d="M265 85 C265 72, 285 72, 285 85" />
        </g>
      </svg>
    );
  }

  // 8. Chennai: Central Station & Coastal Gopuram
  if (norm.includes("chennai") || norm.includes("coimbatore") || norm.includes("madurai")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        {/* Chennai Central Station Gothic Clock Tower */}
        <g stroke={strokeColor} strokeWidth="1.3" strokeOpacity="0.75">
          <rect x="140" y="115" width="130" height="50" />
          {/* Center Grand Clock Tower */}
          <rect x="185" y="45" width="35" height="70" />
          <circle cx="202.5" cy="65" r="8" strokeWidth="1" />
          <line x1="202.5" y1="65" x2="202.5" y2="60" strokeWidth="1" />
          <line x1="202.5" y1="65" x2="207" y2="65" strokeWidth="1" />
          {/* Tower Pyramidal Spire */}
          <path d="M185 45 L202.5 20 L220 45 Z" />
          {/* Side Arches */}
          <path d="M152 145 C152 135, 168 135, 168 145 L168 165" strokeWidth="0.9" />
          <path d="M242 145 C242 135, 258 135, 258 145 L258 165" strokeWidth="0.9" />
        </g>
      </svg>
    );
  }

  // 9. Dubai & Gulf: Burj Khalifa & Skyline
  if (norm.includes("dubai") || norm.includes("abu-dhabi") || norm.includes("doha") || norm.includes("riyadh")) {
    return (
      <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
        <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
        {/* Burj Khalifa Needle */}
        <g stroke={strokeColor} strokeWidth="1.3" strokeOpacity="0.8">
          <path d="M190 165 L195 90 L198 45 L200 15 L202 45 L205 90 L210 165 Z" />
          <line x1="200" y1="15" x2="200" y2="165" strokeWidth="0.8" />
          {/* Tiered setbacks */}
          <line x1="193" y1="130" x2="207" y2="130" />
          <line x1="195" y1="95" x2="205" y2="95" />
          <line x1="198" y1="55" x2="202" y2="55" />
        </g>
        {/* Burj Al Arab Sail on Left */}
        <g stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.55">
          <path d="M120 165 C120 90, 160 85, 160 165" />
          <line x1="160" y1="80" x2="160" y2="165" strokeWidth="1.5" />
          <line x1="140" y1="95" x2="160" y2="95" />
        </g>
      </svg>
    );
  }

  // 10. Default Iconic Architectural Heritage Skyline (Domes, Arches & Modern Horizon)
  return (
    <svg viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain">
      <line x1="10" y1="165" x2="390" y2="165" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
      <g stroke={strokeColor} strokeWidth="1.2" strokeOpacity="0.65">
        {/* Left Monument Arch */}
        <rect x="70" y="110" width="60" height="55" />
        <path d="M85 165 L85 130 C85 120, 115 120, 115 130 L115 165" />
        <rect x="65" y="100" width="70" height="10" />
        {/* Center Grand Dome & Towers */}
        <rect x="170" y="115" width="90" height="50" />
        <path d="M190 115 C190 70, 240 70, 240 115" />
        <line x1="215" y1="70" x2="215" y2="50" strokeWidth="1.3" />
        <circle cx="215" cy="46" r="3" />
        {/* Right Skyline Horizon */}
        <rect x="290" y="80" width="30" height="85" />
        <path d="M290 80 L305 55 L320 80 Z" />
        <rect x="330" y="105" width="25" height="60" />
      </g>
    </svg>
  );
}
