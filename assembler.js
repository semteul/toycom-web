// https://yhong.tistory.com/23
function assemble(code) {
    var lines = code.split('\n');
    var binary = [];
    for(var i=0;i<lines.length;i++){
        var line = lines[i];
        if(line.length == 0) 
            continue;

        try {
            var result = parser.parseInstruction(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseLDI(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseLD(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseST(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseMV(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parsePush(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parsePop(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try { 
            var result = parser.parse1oper(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parse2oper(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseCMP(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseFlag(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseBranch(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseReturn(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        try {
            var result = parser.parseControl(line);
            if(result) {
                binary.push(result);
                continue;
            }
        } catch(e) { console.log(e); }

        console.log("invalid instruction : " + line);
    }
    return binary;
}

function binaryCodeToString(lt) {
    var result = "";
    for(var i=0;i<lt.length;i++){
        binary = lt[i];

        if(!binary) {
            result += "\n";
            continue;
        }
        if(typeof(binary[0]) === "string") {
            result += binary[0] + " " + binary[1] + "\n";
            continue;
        }

        result += showBinary(binary) + "\n";
    }

    return result;
}

function showBinary(lt) {
    h = lt[0];
    l = lt[1];
    return h.toString(2).padStart(8, '0') + "_" + l.toString(2).padStart(8, '0');
}

function type1(opcode, Rd, immediate){
    let h = (opcode << 3) + Rd;
    let l = immediate;
    return [h&0xff, l&0xff];
}

function type2(opcode, Rd, Rs1, sop1, sop2){
    let h = (opcode << 3) + Rd;
    let l = (Rs1 << 5) + (sop1 << 2) + sop2;
    return [h&0xff, l&0xff];

}

function type3(opcode, Rd, Rs1, Rs2, sop2){
    let h = (opcode << 3) + Rd;
    let l = (Rs1 << 5) + (Rs2 << 2) + sop2;
    return [h&0xff, l&0xff];
}

function type4(opcode, offset){
    let h = (opcode << 3) + (offset >> 8);
    let l = offset;
    return [h&0xff, l&0xff];
}

var parser = {
    parseInstruction : function(line){
        const org = /^\.org\s+0x([0-9]+)/;
        if(org.test(line)){
            let match = line.match(org);
            return [".org", parseInt(match[1], 16)];
        }
        return null;
    },
    // LDI, LD, ST, MV, PUSH, POP
    parseLDI : function(line){
        //LDI Rd, #value 
        const pattern = /LDI\s+R([0-7])\s*,\s*#(.+)/;

        if(/^LDI/.test(line)){
            const match = line.match(pattern);

            if(!match) {
                throw "Invalid LDI instruction : " + line;
            }

            const Rd = parseInt(match[1]);
            const value = this.parseValue(match[2]);

            return type1(0b00001, Rd, value);
        }
        return null;
    },
    parseLD : function(line){
        //LD Rd, (Rs+1:Rs)
        const pattern = /LD\s+R([0-7])\s*,\s*\(R([0-7])\+1:R([0-7])\)/;
        if(/^LD/.test(line)){
            const match = line.match(pattern);
            if(!match) {
                throw "Invalid LD instruction : " + line;
            }

            const Rd = parseInt(match[1]);
            const Rs1 = parseInt(match[2]);
            const Rs2 = parseInt(match[3]);

            // rs 검사
            if(Rs1 != Rs2){
                throw "Rs가 일치하지 않습니다 : " + line;
            }

            if(Rs1 % 2 == 1){
                throw "Rs는 짝수의 레지스터여야 합니다 : " + line;
            }

            return type2(0b00010, Rd, Rs1, 0b000, 0b00);
        }
        return null;
    },
    parseST : function(line){
        //ST Rd, (Rs+1:Rs)
        const pattern = /ST\s+\(R([0-7])\+1:R([0-7])\)\s*,\s*R([0-7])/;
        if(/^ST/.test(line)){
            const match = line.match(pattern);
            if(!match) {
                throw "Invalid ST instruction : " + line;
            }

            const Rd1 = parseInt(match[1]);
            const Rd2 = parseInt(match[2]);
            const Rs = parseInt(match[3]);

            // rs 검사
            if(Rd1 != Rd2){
                throw "Rd가 일치하지 않습니다 : " + line;
            }

            if(Rd1 % 2 == 1){
                throw "Rd는 짝수의 레지스터여야 합니다 : " + line;
            }

            return type2(0b00010, Rd1, Rs, 0b000, 0b01);
        }
        return null;
    },
    parseMV : function(line){
        //MV Rd, Rs
        const pattern = /MV\s+R([0-7])\s*,\s*R([0-7])/;
        if(/^MV/.test(line)){
            const match = line.match(pattern);
            if(!match) {
                throw "Invalid MV instruction : " + line;
            }

            const Rd = parseInt(match[1]);
            const Rs = parseInt(match[2]);

            return type2(0b00010, Rd, Rs, 0b001, 0b00);
        }
        return null;
    },
    parsePush : function(line){
        //PUSH Rs
        const pattern = /PUSH\s+R([0-7])/;
        if(/^PUSH/.test(line)){
            const match = line.match(pattern);
            if(!match) {
                throw "Invalid PUSH instruction : " + line;
            }

            const Rs = parseInt(match[1]);

            return type2(0b00011, 0, Rs, 0b000, 0b00);
        }
        return null;
    },
    parsePop : function(line){
        //POP Rd
        const pattern = /POP\s+R([0-7])/;
        if(/^POP/.test(line)){
            const match = line.match(pattern);
            if(!match) {
                throw "Invalid POP instruction : " + line;
            }

            const Rd = parseInt(match[1]);

            return type2(0b00011, Rd, 0, 0b000, 0b01);
        }
        return null;
    },
    // INC, DEC, NEG, NOT, SHL, SHR, ASL, ASR 
    parse1oper : function(line){ 
        const pattern = /^INC|^DEC|^NEG|^NOT|^SHL|^SHR|^ASL|^ASR/;
        if(pattern.test(line)){
            const match = line.replace(pattern,"").match(/^ R([0-7])/);
            if(!match) {
                throw "Invalid 1opr instruction : " + line;
            }

            const Rd = parseInt(match[1]);
            if(/^INC/.test(line)) return type2(0b00100, Rd, 0, 0b000, 0b00);
            if(/^DEC/.test(line)) return type2(0b00100, Rd, 0, 0b000, 0b01);
            if(/^NEG/.test(line)) return type2(0b00100, Rd, 0, 0b000, 0b10);
            if(/^NOT/.test(line)) return type2(0b00100, Rd, 0, 0b000, 0b11);
            if(/^SHL/.test(line)) return type2(0b00100, Rd, 0, 0b001, 0b00);
            if(/^SHR/.test(line)) return type2(0b00100, Rd, 0, 0b001, 0b01);
            if(/^ASL/.test(line)) return type2(0b00100, Rd, 0, 0b001, 0b10);
            if(/^ASR/.test(line)) return type2(0b00100, Rd, 0, 0b001, 0b11);
        }
        return null;
    },
    // ADD, ADC, SUB, SBC, AND, OR, XOR 
    parse2oper : function(line) {
        const pattern = /^ADD|^ADC|^SUB|^SBC|^AND|^OR|^XOR/;
        if(pattern.test(line)){
            const match = line.replace(pattern,"").match(/^ R([0-7]), R([0-7]), R([0-7])/);
            if(!match) {
                throw "Invalid 2opr instruction : " + line;
            }

            const Rd = parseInt(match[1]);
            const Rs1 = parseInt(match[2]);
            const Rs2 = parseInt(match[3]);

            if(/^ADD/.test(line)) return type3(0b00101, Rd, Rs1, Rs2, 0b00);
            if(/^ADC/.test(line)) return type3(0b00101, Rd, Rs1, Rs2, 0b01);
            if(/^SUB/.test(line)) return type3(0b00101, Rd, Rs1, Rs2, 0b10);
            if(/^SBC/.test(line)) return type3(0b00101, Rd, Rs1, Rs2, 0b11);
            if(/^AND/.test(line)) return type3(0b00110, Rd, Rs1, Rs2, 0b00);
            if(/^OR/.test(line)) return type3(0b00110, Rd, Rs1, Rs2, 0b01);
            if(/^XOR/.test(line)) return type3(0b00110, Rd, Rs1, Rs2, 0b10);
        }
        return null;
    },
    // CMP, CLC, STC, CLI, STI
    parseCMP : function(line) {
        const pattern = /^CMP\s+R([0-7])\s*,\s*R([0-7])/;
        if(pattern.test(line)){
            const match = line.match(pattern);
            if(!match) {
                throw "Invalid CMP instruction : " + line;
            }

            const Rs1 = parseInt(match[1]);
            const Rs2 = parseInt(match[2]);

            return type3(0b00111, 0, Rs1, Rs2, 0b00);
        }
        return null;
    },
    parseFlag : function(line){
        const pattern = /^CLC|^STC|^CLI|^STI/;
        if(pattern.test(line)){
            if(/^CLC/.test(line)) return type2(0b01000, 0, 0, 0b000, 0b00);
            if(/^STC/.test(line)) return type2(0b01000, 0, 0, 0b000, 0b01);
            if(/^CLI/.test(line)) return type2(0b01000, 0, 0, 0b000, 0b10);
            if(/^STI/.test(line)) return type2(0b01000, 0, 0, 0b000, 0b11);
        }
        return null;
    },
    // BR, BRNZ, BRZ, BRNS, BRS, BRNC, BRC, BRNV, BRV, BRE, BRA, BRAE, BRBE, BRB, BRGT, BRGE, BRLE, BRLT, CALL
    parseBranch : function(line){
        const pattern = /^BR|^BRNZ|^BRZ|^BRNS|^BRS|^BRNC|^BRC|^BRNV|^BRV|^BRE|^BRA|^BRAE|^BRBE|^BRB|^BRGT|^BRGE|^BRLE|^BRLT|^CALL/;
        if(pattern.test(line)){
            var match = line.replace(pattern,"").match(/^ (.+)/);
            if(!match){
                throw "Invalid Branch instruction : " + line;
            }
            var offset = this.parseValue(match[1],11);
            if(/^BR/.test(line))    return type4(0b10000, offset);
            if(/^BRNZ/.test(line))  return type4(0b10001, offset);
            if(/^BRZ/.test(line))   return type4(0b10010, offset);
            if(/^BRNS/.test(line))  return type4(0b10011, offset);
            if(/^BRS/.test(line))   return type4(0b10100, offset);
            if(/^BRNC/.test(line))  return type4(0b10101, offset);
            if(/^BRC/.test(line))   return type4(0b10110, offset);
            if(/^BRNV/.test(line))  return type4(0b10111, offset);
            if(/^BRV/.test(line))   return type4(0b11000, offset);
            if(/^BRE/.test(line))   return type4(0b11001, offset);
            if(/^BRA/.test(line))   return type4(0b11010, offset);
            if(/^BRAE/.test(line))  return type4(0b11011, offset);
            if(/^BRBE/.test(line))  return type4(0b11100, offset);
            if(/^BRB/.test(line))   return type4(0b11101, offset);
            if(/^BRGT/.test(line))  return type4(0b11110, offset);
            if(/^BRGE/.test(line))  return type4(0b11111, offset);
            if(/^BRLE/.test(line))  return type4(0b10000, offset);
            if(/^BRLT/.test(line))  return type4(0b10000, offset);
            if(/^CALL/.test(line))  return type4(0b11111, offset);

        }
        return null;
    },
    
    // RET, RETI
    parseReturn : function(line){
        if(/^RETI/.test(line)) return type2(0b01001, 0, 0, 0b000, 0b01);
        if(/^RET/.test(line))  return type2(0b01001, 0, 0, 0b000, 0b00);
        return null;
    },

    // NOP, HALT
    parseControl : function(line){
        if(/^NOP/.test(line))  return type2(0b00000, 0, 0, 0b000, 0b00);
        if(/^HALT/.test(line)) return type2(0b00000, 0, 0, 0b000, 0b01);
        return null;
    },

    parseValue : function(string, bits=8){
        var int = /^([0-9]+)$/;
        var hex = /^0x([0-9a-fA-F]+)$/;
        var bin = /^0b([0-1]+)$/;
        if(int.test(string)){
            return parseInt(string.match(int)[1]) & ((1 << bits) - 1);
        }
        if(hex.test(string)){
            return parseInt(string.match(hex)[1], 16) & ((1 << bits) - 1);
        }
        if(bin.test(string)){
            return parseInt(string.match(bin)[1], 2) & ((1 << bits) - 1);
        }
        throw "Invalid value to parse : " + string;
    }
}

/*
var assembler = {
    assemble : function(program) {
        let binarySize = 2**16;
        var counter = 0;
        var instructions = program.split('\n');
        var binaryCodes = [];

        for(var i=0;i<binarySize;i++){
            binaryCodes.append(0);
        }

        for(i=0;i<instructions.length; i++) {
            // .org 처리
            if(/^\.org/.test(instructions[i])){
                counter = parseInt(instructions[i].split(' ')[1],16);
                continue;
            }

            var line = instructions[i];
            var l;  // 하위 비트
            var h; // 상위 비트
            let mask = 0b11111111;

            // 16진수 값 처리
            if(/^0x/.test(line)){
                binaryCodes[counter++] = parseInt(line, 16)&mask;
                continue;
            }

            // 2진수 값 처리
            if(/^0b/.test(line)){
                binaryCodes[counter++] = parseInt(line, 2)&mask;
                continue;
            }

            // 10진수 값 처리
            if(/^[0-9]+/.test(line)){
                binaryCodes[counter++] = parseInt(line, 16)&mask;
                continue;
            }
        }
        return object;
    },
    sliceBits : function(value, sizeList) {
        var result = [];
        for (var i = 0; i < sizeList.length; i++) {
            let mask = (1 << sizeList[i]) - 1;
            result.push(value & mask);
            value = value >> sizeList[i];
        }
        return result;
    
    }
}
*/