with open('src/pages/propostas/steps/StepConsumption.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = 0
for i, line in enumerate(lines):
    if skip > 0:
        skip -= 1
        continue
    if "const history = useWatch({ control, name: 'history' }) || [];" in line:
        if i+4 < len(lines) and "const history = useWatch({ control, name: 'history' }) || [];" in lines[i+4]:
            skip = 4
    new_lines.append(line)

with open('src/pages/propostas/steps/StepConsumption.tsx', 'w') as f:
    f.writelines(new_lines)
