class CPU {
    constructor() {
        this.state = 0;
        this.running = false;
        this.nextTimeout = null;
        this.runDelay = 1000;
        this.ram = new Array(16).fill(0);
        this.registers = {
            acc: 0,
            pc: 0,
            mar: 0,
            mdr: 0,
            cir: 0
        };

        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async step(loop = true) {
        const setState = (nextState, stageName, description) => {
            description = description.replace(/\*(.*?)\*/g, (_, contents) => `<span class="hint_name">${contents}</span>`);
            this.showHint(`<span class="fetch_decode_execute ${stageName.toLowerCase()}">${stageName}</span>${description}`);
            this.state = nextState;
        };

        function setActive(newActive) {
            document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
            document.querySelectorAll(newActive).forEach(el => el.classList.add('active'));
        }

        switch (this.state) {
            case 0:
                setState(1, 'Fetch', 'The *Control Unit* copies the value in the *Program Counter* register to the *Memory Address Register* and onto the *Address Bus*');
                cpu.registers.mar = cpu.registers.pc;
                cpu.updateValues();
                setActive('#reg_pc,#reg_mar');
                document.querySelector('.current_instruction').classList.remove('current_instruction');
                document.getElementById('ram_address_' + cpu.registers.pc).classList.add('current_instruction');
                break;

            case 1:
                setState(2, 'Fetch', 'The *Control Unit* tells the memory store to look at the address on the *Address Bus* and load the value stored there onto the *Data Bus*');
                setActive('#ram_value_' + cpu.registers.mar);
                break;

            case 2:
                setState(3, 'Fetch', 'The *Control Unit* stores the value on the *Data Bus* into the *Memory Data Register*');
                cpu.registers.mdr = cpu.ram[cpu.registers.mar];
                cpu.updateValues();
                setActive('#reg_mdr');
                break;

            case 3:
                setState(4, 'Fetch', 'The *Control Unit* copies the value from the *Memory Data Register* into the *Current Instruction Register*');
                cpu.registers.cir = cpu.registers.mdr;
                cpu.updateValues();
                setActive('#reg_mdr,#reg_cir');
                break;

            case 4:
                setState(5,'Fetch', 'The *Control Unit* increments the *Program Counter*');
                cpu.registers.pc++;
                cpu.updateValues();
                setActive('#reg_pc');
                break;

            case 5:
                setState(6, 'Decode', 'The *Decode Unit* breaks the value in the *Current Instruction Register* into the *opcode* and *operand*.');
                setActive('#reg_cir,.decode_unit table');
                break;

            case 6:
                let opcode = ((cpu.registers.cir & 0xff) >> 4);

                let newActive = '.decode_row_' + opcode;
                if (opcode == 9) {
                    newActive += cpu.registers.cir & 1 ? '_i' : '_o';
                }
                setActive(newActive);

                switch(opcode) {
                    case 0:
                        setState(7, 'Decode', 'The *opcode* 0000 means end the program');
                        break;

                    case 1:
                        setState(8, 'Decode', 'The *opcode* 0001 means add the value in the *Accumulator* register to the data stored in memory at the address specified by the *operand*');
                        break;

                    case 2:
                        setState(9, 'Decode', 'The *opcode* 0010 means subtract the value stored in memory at the address specified by the *operand* from the value in the *Accumulator* register');
                        break;

                    case 3:
                        setState(10, 'Decode', 'The *opcode* 0011 means store the value in the *Accumulator* register into memory at the address specified by the *operand*');
                        break;

                    case 5:
                        setState(11, 'Decode', 'The *opcode* 0101 means load the value from memory (at the address specified by the *operand*) into the *Accumulator* register');
                        break;

                    case 6:
                        setState(12, 'Decode', 'The *opcode* 0110 means branch (unconditionally)');
                        break;

                    case 7:
                        setState(13, 'Decode', 'The *opcode* 0111 means branch if the *Accumulator* stores a value equal to 0');
                        break;

                    case 8:
                        setState(14, 'Decode', 'The *opcode* 1000 means branch if the *Accumulator* stores a value greater or equal to 0 (not negative)');
                        break;

                    case 9:
                        setState(15, 'Decode', 'The *opcode* 1001 means either input or output, depending on the *operand*');
                        break;
                }
                break;

            case 7:
                setState(7, 'Execute', "The CPU has halted so the *Control Unit* doesn't fetch any more instructions");
                document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
                cpu.running = false;
                document.querySelectorAll('.running').forEach(el => el.classList.remove('running'));
                break;

            // Add
            case 8:
                setState(81, 'Decode', 'The *Decode Unit* sends the *opcode* to the *Memory Address Register* which gets copied onto the *Address Bus*');
                cpu.registers.mar = cpu.registers.cir & 0x0F;
                cpu.updateValues();
                setActive('#reg_mar,.decode_row_1');
                break;

            case 81:
                setState(82, 'Execute', 'The *Control Unit* tells the memory store to look at the address on the *Address Bus* and place that value on the *Data Bus*');
                setActive('#ram_value_' + cpu.registers.mar);
                break;

            case 82:
                setState(83, 'Execute', 'The *Control Unit* copies the value on the *Data Bus* into the *Memory Data Register*');
                cpu.registers.mdr = cpu.ram[cpu.registers.mar];
                cpu.updateValues();
                setActive('#reg_mdr');
                break;

            case 83:
                setState(0, 'Execute', 'The *opcode* and *Control Unit* signals the *Arithmetic Logic Unit* to add the values stored in the *Accumulator* and *Memory Data Register*s. The result gets saved back in the *Accumulator* register.');
                cpu.registers.acc += cpu.registers.mdr;
                cpu.updateValues();
                setActive('#reg_mdr,#alu,#acc');
                break;

            // Subtract
            case 9:
                setState(91, 'Decode', 'The *Decode Unit* sends the *opcode* to the *Memory Address Register* which gets copied onto the *Address Bus*');
                cpu.registers.mar = cpu.registers.cir & 0x0F;
                cpu.updateValues();
                setActive('#reg_mar');
                break;

            case 91:
                setState(92, 'Execute', 'The *Control Unit* tells the memory store to look at the address on the *Address Bus* and place that value on the *Data Bus*');
                setActive('#ram_value_' + cpu.registers.mar);
                break;

            case 92:
                setState(93, 'Execute', 'The *Control Unit* copies the value on the *Data Bus* into the *Memory Data Register*');
                setActive('#reg_mdr');
                cpu.registers.mdr = cpu.ram[cpu.registers.mar];
                cpu.updateValues();
                break;

            case 93:
                setState(0, 'Execute', 'The *opcode* and *Control Unit* signals the *Arithmetic Logic Unit* to subtract the values stored in the *Memory Data Register* from the value stored in the *Accumulator* register. The result gets saved back in the *Accumulator* register.');
                cpu.registers.acc = cpu.registers.acc - cpu.registers.mdr;
                cpu.updateValues();
                setActive('#alu,#reg_acc,#reg_mdr');
                break;

            // Store
            case 10:
                setState(101, 'Decode', 'The *opcode* and *Control Unit* sends the value stored in the *Accumulator* register to the *Memory Data Register* which gets copied on to the *Data Bus*');
                cpu.registers.mdr = cpu.registers.acc;
                cpu.updateValues();
                setActive('#reg_acc,#reg_mdr');
                break;

            case 101:
                setState(102, 'Decode', 'The *Decode Unit* sends the *operand* to the *Memory Address Register* which gets copied onto the *Address Bus*');
                cpu.registers.mar = cpu.registers.cir & 0x0F;
                cpu.updateValues();
                setActive('#reg_mar');
                break;

            case 102:
                setState(0, 'Execute', 'The *Control Unit* tells the memory store to store the value on the *Data Bus* into the address on the *Address Bus*');
                cpu.ram[cpu.registers.mar] = cpu.registers.mdr;
                cpu.updateValues();
                setActive('#ram_value_' + cpu.registers.mar);
                break;

            // Load
            case 11:
                setState(111, 'Decode', 'The *Decode Unit* sends the *operand* to the *Memory Address Register* which gets copied onto the *Address Bus*');
                cpu.registers.mar = cpu.registers.cir & 0x0F;
                cpu.updateValues();
                setActive('#reg_mar');
                break;

            case 111:
                setState(112, 'Execute', 'The *Control Unit* tells the memory store to look at the address on the *Address Bus* and place that value on the *Data Bus*');
                setActive('#ram_value_' + cpu.registers.mar);
                break;

            case 112:
                setState(113, 'Execute', 'The *Control Unit* copies the value on the *Data Bus* into the *Memory Data Register*');
                cpu.registers.mdr = cpu.ram[cpu.registers.mar];
                cpu.updateValues();
                setActive('#reg_mdr');
                break;

            case 113:
                setState(20, 'Execute', 'The *opcode* and *Control Unit* sends the value in the *Memory Data Register* to the *Accumulator* register.');
                cpu.registers.acc = cpu.registers.mdr;
                cpu.updateValues();
                setActive('#reg_mdr,#reg_acc');
                break;

            // Branch
            case 12:
                setState(20, 'Execute', 'The *operand* gets stored in the *Program Counter*');
                cpu.registers.pc = cpu.registers.cir & 0x0F;
                cpu.updateValues();
                setActive('#reg_pc');
                break;

            // Branch if zero
            case 13:
                setState(20, 'Execute', 'The *Control Unit* and *opcode* makes the *Arithmetic Logic Unit* check to see if the *Accumulator* register contains a zero. If it does, the *operand* gets copied into the *Program Counter* register');
                if (cpu.registers.acc == 0) {
                    cpu.registers.pc = cpu.registers.cir & 0x0F;
                }
                cpu.updateValues();
                setActive('#reg_acc,#reg_pc,#alu');
                break;

            // Branch if not negative
            case 14:
                setState(20, 'Execute', 'The *Control Unit* and *opcode* makes the *Arithmetic Logic Unit* check to see if the *Accumulator* register contains a value greater than zero. If it does, the *operand* gets copied into the *Program Counter* register');
                if (cpu.registers.acc >= 0) {
                    cpu.registers.pc = cpu.registers.cir & 0x0F;
                }
                cpu.updateValues();
                setActive('#alu,#reg_acc,#reg_pc');
                break;

            // Input & output
            case 15:
                if ((cpu.registers.cir & 0x0F) == 1) {
                    setState(20, 'Execute', 'The *opcode* 0001 and the *Control Bus* reads from the input device and places the input value into the *Accumulator* register');
                    cpu.registers.acc = parseInt(await cpu.showPrompt()) & 0xFF;
                    cpu.updateValues();
                    setActive('#reg_acc');
                }
                if ((cpu.registers.cir & 0x0F) == 2) {
                    setState(20, 'Execute', 'The *opcode* 0010 and the *Control Bus* causes the value of the *Accumulator* register to be sent to the output device');
                    await cpu.showAlert(cpu.registers.acc);
                    setActive('#reg_acc');
                }
                break;

            case 20:
                setState(0, 'Execute', 'The *Control Unit* checks for interrupts and either branches to the relevant interrupt service routine or starts the cycle again.');
                break;
        }

        if (this.running && loop) {
            if (this.runDelay == 0) {
                let start = performance.now();
                while (performance.now() - start < 10) {
                    await this.step(false);
                    if (!this.running) {
                        break;
                    }
                }
            }

            if (this.running) {
                this.nextTimeout = setTimeout(async () => await this.step(), this.runDelay);
            }
        }
    }

    showHint(html) {
        document.getElementById('hint_text').innerHTML = html;
    }

    pad(val, length) {
        return val.toString().padStart(length, '0');
    }

    hex2bin(hex) {
        return this.pad(parseInt(hex, 16).toString(2), 8);
    }

    bin2hex(bin) {
        return this.pad(parseInt(bin, 2).toString(16), 2);
    }

    bin2dec(bin) {
        let val = parseInt(bin, 2) & 0xFF;
        return val >= 128 ? val - 256 : val;
    }

    dec2bin(dec) {
        return this.pad((dec & 0xFF).toString(2), 8);
    }

    hex2dec(hex) {
        let val = parseInt(hex, 16) & 0xFF;
        return val >= 128 ? val - 256 : val;
    }

    dec2hex(dec) {
        return this.pad((dec & 0xFF).toString(16), 2);
    }

    updateValues() {
        for (let register in this.registers) {
            if (this.registers[register] > 0x7f) {
                this.registers[register] -= 0x100;
            }

            if (this.registers[register] < -0x80) {
                this.registers[register] += 0x100;
            }
        }

        const writeValue = (val, element) => {
            if (element.classList.contains('value_binary')) val = this.dec2bin(val);
            if (element.classList.contains('value_hex')) val = this.dec2hex(val);
            element.textContent = val;
        };

        Object.entries(this.registers).forEach(([reg, val]) => {
            const element = document.getElementById(`reg_${reg}_val`);
            if (element) writeValue(val, element);
        });

        this.ram.forEach((val, i) => {
            const element = document.getElementById(`ram_value_${i}`);
            if (element) writeValue(val, element);
        });
    }

    updateAnnotations() {
        let d = document.getElementById('drawing');
        d.innerHTML = '';
        let w = d.clientWidth;
        let h = d.clientHeight;
        let paper = Raphael('drawing', w, h);
        paper.clear();

        function connect(from, to, attributes, label, labelAttributes) {
        const cpuElement = document.getElementById('cpu');
            function getX(i, a) {
                const rect = i.getBoundingClientRect();
                const offset = -cpuElement.getBoundingClientRect().left - parseInt(window.getComputedStyle(cpuElement).padding);
                switch(a){
                    case 'left':
                        return rect.left + offset;
                    case 'right':
                        return rect.right + offset;
                    case 'middle':
                        return (rect.left + rect.right) / 2 + offset;
                    default:
                        let percentage = parseInt(a.replace('%', ''));
                        return rect.left + (rect.width * percentage / 100) + offset;
                }
            }

            function getY(i, a) {
                const rect = i.getBoundingClientRect();
                const offset = -cpuElement.getBoundingClientRect().top - parseInt(window.getComputedStyle(cpuElement).padding);
                switch(a){
                    case 'top':
                        return rect.top + offset;
                    case 'bottom':
                        return rect.bottom + offset;
                    case 'middle':
                        return (rect.top + rect.bottom) / 2 + offset;
                    default:
                        let percentage = parseInt(a.replace('%', ''));
                        return rect.top + (rect.bottom * percentage / 100) + offset;
                }
            }

            let x1 = getX(from.e, from.h);
            let x2 = x1;
            if (to.h) {
                x2 = getX(to.e, to.h);
            }

            let y1 = getY(from.e, from.v);
            let y2 = y1;
            if (to.v) {
                y2 = getY(to.e, to.v);
            }

            let e = paper.path('M' + Math.floor(x1) + ' ' + Math.floor(y1) + 'L' +  Math.floor(x2) + ' ' + Math.floor(y2));
            e.attr(attributes);

            if (label) {
                let x = Math.floor((x1 + x2) / 2);
                let y = Math.floor((y1 + y2) / 2);
                let text = paper.text(x, y, label);
                if (labelAttributes) {
                    text.attr(labelAttributes);
                }
            }
        }

        const pc_register = document.getElementById('reg_pc');
        const mar_register = document.getElementById('reg_mar');
        const mdr_register = document.getElementById('reg_mdr');
        const cir_register = document.getElementById('reg_cir');
        const acc_register = document.getElementById('reg_acc');
        const alu = document.getElementById('alu');
        const cu = document.getElementById('cu');
        const ram_table = document.getElementsByClassName('ram')[0];
        const decodeUnit = document.getElementsByClassName('decode_unit')[0];

        const darkModeColors = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let doubleArrow = {
            'stroke-width': 8,
            'stroke': darkModeColors ? '#999' : '#666',
            'arrow-end': 'block',
            'arrow-start': 'block',
            'stroke-linecap': 'round'
        };

        let singleArrow = { ...doubleArrow };
        delete singleArrow['arrow-start'];
        let reverseArrow = { ...doubleArrow };
        delete reverseArrow['arrow-end'];

        connect({e:alu, h:'left', v:'middle'}, {e:decodeUnit, h:'right'}, reverseArrow);
        connect({e:pc_register, h:'right', v:'middle'}, {e:mar_register, h:'left', v:'middle'}, singleArrow);
        connect({e:pc_register, h:'middle', v:'bottom'}, {e:decodeUnit, v:'top'}, reverseArrow);
        connect({e:decodeUnit, h:'right', v:'top'}, {e:mar_register, h:'left', v:'bottom'}, singleArrow);
        connect({e:mdr_register, h:'middle', v:'bottom'}, {e:cir_register, h:'middle', v:'top'}, singleArrow);
        connect({e:cir_register, h:'left', v:'middle'}, {e:decodeUnit, h:'right'}, singleArrow);
        connect({e:alu, h:'middle', v:'bottom'}, {e:mdr_register, v:'top'}, reverseArrow);
        connect({e:alu, h:'middle', v:'top'}, {e:acc_register, v:'bottom'}, doubleArrow);
        connect({e:mdr_register, h:'80%', v:'top'}, {e:acc_register, h:'80%', v:'bottom'}, doubleArrow);

        singleArrow['stroke'] = doubleArrow['stroke'] = darkModeColors ? '#825' : '#f66';
        singleArrow['stroke-width'] = doubleArrow['stroke-width'] = 18;

        const labelAttributes = {
            'font-family': 'Roboto Mono',
            'font-weight': 'bold',
            'font-size': '16px',
            'fill': darkModeColors ? '#eee' : '#333'
        };

        connect({e:mar_register, h:'right', v:'middle'}, {e: ram_table, h:'left'}, singleArrow, 'Address bus', labelAttributes);
        connect({e:mdr_register, h:'right', v:'middle'}, {e: ram_table, h:'left'}, doubleArrow, 'Data bus', labelAttributes);
        connect({e:cu, h:'right', v:'middle'}, {e: ram_table, h:'left'}, doubleArrow, 'Control bus', labelAttributes);
    }

    showAlert(message) {
        return new Promise(resolve => {
            document.getElementById('output_value').textContent = message;
            const modal = document.getElementById('modal_output_value');
            new bootstrap.Modal(modal).show();
            modal.addEventListener('hidden.bs.modal', () => resolve(), { once: true });
        });
    }

    showPrompt() {
        return new Promise(resolve => {
            const inputField = document.getElementById('input_value');
            inputField.value = '';
            const modal = document.getElementById('modal_input_value');
            new bootstrap.Modal(modal).show();
            inputField.focus();
            modal.addEventListener('hidden.bs.modal', () => resolve(inputField.value), { once: true });
        });
    }

    init() {
        window.addEventListener('resize', () => this.updateAnnotations());
        this.generateTable(document.getElementById('ram_table'));
        this.attachEventListeners();
        this.updateAnnotations();
        this.runDelay = document.querySelector('#run_speed').value;
    }

    generateTable(tableElement) {
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Address', 'Value'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        tableElement.appendChild(thead);

        let params = window.location.search.substring(1);
        let ram = [];
        let initZeros = true;

        if (ram = params.replace('ram=', '')) {
            if (ram = ram.match(/([0-9a-fA-F]{2})/g)) {
                initZeros = false;
            }
        }

        const tbody = document.createElement('tbody');
        for(let address = 0; address < 16; address++) {
            cpu.ram[address] = initZeros ? 0 : cpu.hex2dec(ram[address]);

            const row = document.createElement('tr');

            const addressCell = document.createElement('td');
            addressCell.id = `ram_address_${address}`;
            addressCell.className = `value value_decimal${address === 0 ? ' current_instruction' : ''}`;
            addressCell.textContent = address;

            const valueCell = document.createElement('td');
            valueCell.id = `ram_value_${address}`;
            valueCell.className = 'value value_decimal editable';
            valueCell.dataset.description = `Memory address ${address}`;
            valueCell.textContent = cpu.ram[address];

            row.appendChild(addressCell);
            row.appendChild(valueCell);
            tbody.appendChild(row);
        }

        tableElement.appendChild(tbody);
    }

    attachEventListeners() {
        document.getElementById('btn_step').addEventListener('click', async () => await this.step());
        document.querySelectorAll('#btn_run, .btn_stop').forEach((e) => e.addEventListener('click', async () => {
            if (this.running || e.classList.contains('btn_stop')) {
                this.running = false;
                clearTimeout(this.nextTimeout);
                document.getElementById('btn_run').classList.remove('running')
                document.querySelectorAll('.btn_stop').forEach((e) => e.style = 'display: none;');
            } else {
                this.running = true;
                document.getElementById('btn_run').classList.add('running')
                document.querySelectorAll('.btn_stop').forEach((e) => e.style = '');
                await this.step();
            }
        }));

        const modalChangeValue = document.querySelector('#modal_change_value');

        const modal = new bootstrap.Modal(modalChangeValue, { show: false });

        document.querySelector('#run_speed').addEventListener('change', (e) => {
            cpu.runDelay = e.target.value;
        });

        document.querySelector('#btn_reset_cpu').addEventListener('click', () => {
            cpu.state = 0;
            cpu.running = false;
            clearTimeout(cpu.nextTimeout);
            Object.assign(cpu.registers, {
                acc: 0, cir: 0, mar: 0, mdr: 0, pc: 0
            });
            cpu.showHint('CPU registers and execution state reset to zero');

            document.querySelectorAll('.current_instruction').forEach(el => el.classList.remove('current_instruction'));
            document.querySelector('#ram_address_0').classList.add('current_instruction');
            document.querySelectorAll('.running, .active').forEach(el => el.classList.remove('running', 'active'));
            cpu.updateValues();
        });

        document.querySelector('#btn_reset_ram').addEventListener('click', () => {
            cpu.showHint('All memory store values set to zero');
            for(let address = 0; address < 16; address++) {
                cpu.ram[address] = 0;
                const element = document.querySelector(`#ram_value_${address}`);
                if (element.classList.contains('value_decimal')) {
                    element.textContent = '0';
                } else if (element.classList.contains('value_binary')) {
                    element.textContent = '00000000';
                } else if (element.classList.contains('value_hex')) {
                    element.textContent = '00';
                }
            }
        });

        document.querySelectorAll('.value.editable').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = e.currentTarget.id;
                const element = document.querySelector(`#${id}`);
                document.querySelector('#modal_change_value_title').textContent = element.dataset.description;
                document.querySelector('#change_value_from').textContent = element.textContent;
                document.querySelector('#change_value_to').value = element.textContent;
                cpu.lastChangedValue = id;
                modal.show();
            });
        });

        document.querySelector('#btn_change_value_ok').addEventListener('click', () => {
            const getInt = (element, val) => {
                if (element.classList.contains('value_hex')) {
                    return cpu.hex2dec(val);
                }
                if (element.classList.contains('value_binary')) {
                    return cpu.bin2dec(val);
                }
                const parsed = parseInt(val, 10) & 0xFF;
                return parsed >= 128 ? parsed - 256 : parsed;
            };

            const element = document.querySelector(`#${cpu.lastChangedValue}`);
            const value = document.querySelector('#change_value_to').value;
            const [type, reg, address] = cpu.lastChangedValue.split('_');

            if (type === 'ram') {
                cpu.ram[parseInt(address)] = getInt(element, value);
            } else if (type === 'reg') {
                cpu.registers[reg] = getInt(element, value);
            }
            cpu.updateValues();
        });

        modalChangeValue.addEventListener('shown.bs.modal', () => {
            const changeValueTo = document.querySelector('#change_value_to');
            changeValueTo.focus();
            changeValueTo.select();
        });

        document.querySelector('#modal_export').addEventListener('shown.bs.modal', () => {
            const hex = cpu.ram.map(val => cpu.dec2hex(val)).join(' ');
            const exportHex = document.querySelector('#export_hex');
            exportHex.value = hex;
            exportHex.focus();
            exportHex.select();
        });

        document.querySelector('#btn_import').addEventListener('click', () => {
            const bytes = document.querySelector('#export_hex').value.split(' ');
            bytes.slice(0, cpu.ram.length).forEach((byte, i) => {
                cpu.ram[i] = cpu.hex2dec(byte);
            });
            cpu.updateValues();
        });

        document.querySelector('#btn_export').addEventListener('click', () => {
            const bytes = document.querySelector('#export_hex').value.replace(/ /g, '');
            window.location.search = `?ram=${bytes}`;
        });

        document.querySelectorAll('.btn_values').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.id.split('_')[2];

                if (!['binary', 'hex', 'decimal'].includes(mode)) return;

                document.querySelectorAll('.value').forEach(element => {
                    let val = element.textContent;
                    if (element.classList.contains('value_binary')) val = parseInt(val, 2);
                    if (element.classList.contains('value_decimal')) val = parseInt(val, 10);
                    if (element.classList.contains('value_hex')) val = parseInt(val, 16);

                    element.textContent = mode === 'binary' ? cpu.dec2bin(val) :
                        mode === 'hex' ? cpu.dec2hex(val) :
                            val.toString();

                    element.classList.remove('value_binary', 'value_decimal', 'value_hex');
                    element.classList.add(`value_${mode}`);
                });
            });
        });

        document.querySelector('#input_value').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^-0-9]/g, '');
        });

        document.querySelector('#change_value_to').addEventListener('input', (e) => {
            const firstValue = document.querySelector('.value');
            if (firstValue.classList.contains('value_binary')) {
                e.target.value = e.target.value.replace(/[^01]/g, '');
            } else if (firstValue.classList.contains('value_hex')) {
                e.target.value = e.target.value.replace(/[^0-9a-fA-F]/g, '');
            } else if (firstValue.classList.contains('value_decimal')) {
                e.target.value = e.target.value.replace(/[^-0-9]/g, '');
            }
        });

        document.querySelector('#btn_values_binary').click();
    }
}

const cpu = new CPU();

document.addEventListener('DOMContentLoaded', () => {
    const updateTheme = () => {
        document.documentElement.setAttribute('data-bs-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    };
    updateTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
});
