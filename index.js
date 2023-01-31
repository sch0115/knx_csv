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

function othersOnly(groupObject) {
    return groupObject.address.includes('/4/') && groupObject.name !== '' && groupObject.name !== ' ';
}

function buttonsOnly(groupObject) {
    return groupObject.address.includes('/3/') && groupObject.name !== '' && groupObject.name !== ' ';
}

function switchesOnly(groupObject) {
    return groupObject.address.includes('/0/') && groupObject.name !== '' && groupObject.name !== ' ';
}

function binarySensorsOnly(groupObject) {
    return groupObject.address.includes('/2/') && groupObject.name !== '' && groupObject.name !== ' ';
}

function sensorsOnly(groupObject) {
    return groupObject.address.includes('/1/') && groupObject.name !== '' && groupObject.name !== ' ';
}

function writeButtons(groupObjects = []) {
        const buttons = groupObjects.filter(buttonsOnly);

        writeLine('switch:')
        buttons.forEach(s => {
            writeLine(` - name: "${s.name}"`);
            writeLine(`   address: "${s.address}"`);
        });
  }

function writeSwitches(groupObjects = []) {
        const switches = groupObjects.filter(switchesOnly);

        writeLine('switch:')
        switches.forEach(s => {
          writeLine(` - name: "${s.name}"`);
          writeLine(`   address: "${s.address}"`);
        });
  }

function writeOthers(groupObjects = []) {
        const switches = groupObjects.filter(othersOnly);

        writeLine('others-FAKE-notWORKING:')
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
        const sensor_type = sensor.name.split(' ')[sensor.name.split(' ').length-1]
        switch (sensor_type) {
            case 'jas':
                return 'brightness'
            case 'teplota':
                return 'temperature'
            default:
                return 'humidity'
        }
    }
}


function writeHomeAssistantYaml(groupObjects) {
    writeSwitches(groupObjects)
    // writeButtons(groupObjects)
    writeSensors(groupObjects)
    writeBinarySensors(groupObjects)
    // writeOthers(groupObjects)
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
console.log('Successfully converted')

