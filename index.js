const csv = require('csv-parser')
const fs = require('fs')
const Transform = require('stream').Transform;

const addHeaders = new Transform({
    transform: (chunk, encoding, done) => {
        const headers =  'primary,secondary,name,address,dataType'
        const newLine = '\r\n'
        const fileContent = chunk.toString()
        if (fileContent.includes(headers)) {
            done(null, fileContent)
        } else {
            done(null, headers + newLine + fileContent)
        }
    }
})


function writeLine(line) {
    fs.writeFileSync(outputFileName, `\n${line}`, { flag: 'a+' }, _err => {});
}

function switchesOnly() {
    return groupObject => groupObject.address.includes('/3/') && !groupObject.name.includes('LED') && groupObject.name !== '';
}

function binarySensorsOnly() {
    return groupObject => groupObject.address.includes('/2/') && groupObject.name !== '';
}

function sensorsOnly() {
    return groupObject => groupObject.address.includes('/1/') && groupObject.name !== '';
}

function writeSwitches(groupObjects = []) {
        const switches = groupObjects.filter(switchesOnly);

        writeLine('switch:')
        switches.forEach(s => {
          writeLine(` - name: "${s.name}"`);
          writeLine(`   address: "${s.address}"`);
        });
  }

function writeBinarySensors(groupObjects = []) {
        const binary_sensors = groupObjects.filter(binarySensorsOnly);

        writeLine('binary_sensor:')
        binary_sensors.forEach(bs => {
          writeLine(` - name: "${bs.name}"`);
          writeLine(`   state_address: "${bs.address}"`);
          writeLine(`   device_class: motion`);
        });
  }

function writeSensors(groupObjects = []) {
        const sensors = groupObjects.filter(sensorsOnly)

        writeLine('sensor:')
        sensors.forEach(s => {
          writeLine(` - name: "${s.name}"`);
          writeLine(`   state_address: "${s.address}"`);
          writeLine(`   type: ${getSensorType(s)}`);
        });

        function getSensorType(sensor) {
            return sensor.name.includes('jas') ? 'brightness' : 'temperature'
        }
  }


function writeHomeAssistantYaml(groupObjects) {
    writeSwitches(groupObjects)
    writeBinarySensors(groupObjects)
    writeSensors(groupObjects)
}


function transform(sourceFileName) {
    const groupObjects = [];
    fs.createReadStream(sourceFileName)
        .pipe(addHeaders)
        .pipe(csv())
        .on('data', (data) => groupObjects.push(data))
        .on('end', () => writeHomeAssistantYaml(groupObjects));
}

// Actual transformation run with given parameters or defaults
const sourceFileName = process.argv[2] || 'knx.csv'
const outputFileName = process.argv[3] || 'ha.yaml'

transform(sourceFileName);

