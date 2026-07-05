const fs = require('fs');

let file = 'src/pages/propostas/steps/StepConsumption.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('calcularConsumoEquipamento')) {
  // Find where calculations are imported or add them
  if (content.includes("import { calcularConsumoMensalEstimado, calcularConsumoDiarioTotal } from '../../../lib/calculations/loadSurvey';")) {
     content = content.replace(
       "import { calcularConsumoMensalEstimado, calcularConsumoDiarioTotal } from '../../../lib/calculations/loadSurvey';",
       "import { calcularConsumoMensalEstimado, calcularConsumoDiarioTotal, calcularConsumoEquipamento } from '../../../lib/calculations/loadSurvey';"
     );
  } else {
    // maybe it imports something else
    content = content.replace(/import \{.*?\} from '..\/..\/..\/lib\/calculations\/loadSurvey';/, "import { calcularConsumoMensalEstimado, calcularConsumoDiarioTotal, calcularConsumoEquipamento } from '../../../lib/calculations/loadSurvey';");
  }
  
  content = content.replace(
    /const daily = \(power \* qty \* hours\) \/ 1000;/g,
    "const daily = calcularConsumoEquipamento(power, qty, hours);"
  );
  fs.writeFileSync(file, content);
}
