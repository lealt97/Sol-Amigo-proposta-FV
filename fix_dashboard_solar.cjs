const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace(
  "<td className=\"px-4 py-3 text-xs text-[#E4E4E7]\">{Array.isArray(prop.solar) ? prop.solar[0]?.installed_power_kwp : prop.solar?.installed_power_kwp ? prop.solar.installed_power_kwp.toFixed(1) + ' kWp' : '-'}</td>",
  `<td className="px-4 py-3 text-xs text-[#E4E4E7]">
    {(() => {
      const solarObj = Array.isArray(prop.solar) ? prop.solar[0] : prop.solar;
      return solarObj?.installed_power_kwp ? solarObj.installed_power_kwp.toFixed(1) + ' kWp' : '-';
    })()}
  </td>`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
