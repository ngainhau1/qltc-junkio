const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const swaggerSpec = require('../config/swagger');
const Converter = require('openapi-to-postmanv2');

const DOCS_DIR = path.join(__dirname, '../docs');
const POSTMAN_PATH = path.join(__dirname, '..', '..', 'docx', '07-tham-chieu', 'postman', 'Junkio.postman_collection.json');

if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
}

console.log('[docs:build] Bat dau trich xuat tai lieu...');

function renderExample(example, indent = '') {
    if (!example) return '';
    const json = JSON.stringify(example, null, 2);
    return `\n${indent}\`\`\`json\n${json}\n\`\`\`\n`;
}

function renderParams(params) {
    if (!params || params.length === 0) return '';
    let md = '\n| Tham so | Vi tri | Mo ta | Bat buoc | Kieu du lieu |\n';
    md += '| --- | --- | --- | --- | --- |\n';
    for (const p of params) {
        const name = p.name || '';
        const loc = p.in || '';
        const desc = (p.description || '').replace(/\n/g, ' ');
        const req = p.required ? 'Co' : 'Khong';
        let type = '';
        if (p.schema) {
            type = p.schema.type || '';
            if (p.schema.enum) type += ` (${p.schema.enum.join(', ')})`;
            if (p.schema.default !== undefined) type += ` [mac dinh: ${p.schema.default}]`;
            if (p.schema.format) type += ` (${p.schema.format})`;
        }
        md += `| \`${name}\` | ${loc} | ${desc} | ${req} | ${type} |\n`;
    }
    return md;
}

function renderRequestBody(body) {
    if (!body) return '';
    let md = '\n**Request Body:**\n';
    const content = body.content;
    if (!content) return md;

    for (const [mediaType, mediaObj] of Object.entries(content)) {
        md += `\n*Content-Type:* \`${mediaType}\`\n`;

        if (mediaObj.schema && mediaObj.schema.properties) {
            md += '\n| Truong | Kieu | Bat buoc | Mo ta |\n';
            md += '| --- | --- | --- | --- |\n';
            const required = mediaObj.schema.required || [];
            for (const [key, val] of Object.entries(mediaObj.schema.properties)) {
                const type = val.type || '';
                const req = required.includes(key) ? 'Co' : 'Khong';
                const desc = (val.description || val.example || '').toString().replace(/\n/g, ' ');
                md += `| \`${key}\` | ${type} | ${req} | ${desc} |\n`;
            }
        }

        if (mediaObj.example) {
            md += '\n**Vi du:**\n';
            md += renderExample(mediaObj.example);
        }

        if (mediaObj.examples) {
            for (const [exName, exObj] of Object.entries(mediaObj.examples)) {
                const summary = exObj.summary || exName;
                md += `\n**Vi du - ${summary}:**\n`;
                md += renderExample(exObj.value);
            }
        }
    }
    return md;
}

function renderResponses(responses) {
    if (!responses) return '';
    let md = '\n**Responses:**\n\n';
    md += '| Code | Mo ta |\n';
    md += '| --- | --- |\n';

    const details = [];

    for (const [code, resp] of Object.entries(responses)) {
        const desc = (resp.description || '').replace(/\n/g, ' ');
        md += `| \`${code}\` | ${desc} |\n`;

        if (resp.content) {
            for (const [, mediaObj] of Object.entries(resp.content)) {
                if (mediaObj.example) {
                    details.push({ code, example: mediaObj.example });
                }
            }
        }
    }

    for (const d of details) {
        md += `\n**Response ${d.code} - Vi du:**\n`;
        md += renderExample(d.example);
    }

    return md;
}

function generateMarkdown(spec) {
    let md = '';

    md += `# ${spec.info.title}\n\n`;
    if (spec.info.description) {
        md += `${spec.info.description}\n\n`;
    }
    md += `**Phien ban:** ${spec.info.version}\n\n`;
    md += '---\n\n';

    const tagMap = {};
    const tagDescriptions = {};

    if (spec.tags) {
        for (const tag of spec.tags) {
            tagDescriptions[tag.name] = tag.description || '';
        }
    }

    for (const [pathStr, methods] of Object.entries(spec.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
            if (typeof operation !== 'object') continue;
            const tags = operation.tags || ['Khac'];
            for (const tag of tags) {
                if (!tagMap[tag]) tagMap[tag] = [];
                tagMap[tag].push({ path: pathStr, method: method.toUpperCase(), operation });
            }
        }
    }

    for (const [tagName, endpoints] of Object.entries(tagMap)) {
        md += `## ${tagName}\n\n`;

        if (tagDescriptions[tagName]) {
            md += `${tagDescriptions[tagName].trim()}\n\n`;
        }

        for (const ep of endpoints) {
            const op = ep.operation;
            md += `### ${ep.method} \`${ep.path}\`\n\n`;

            if (op.summary) {
                md += `**${op.summary}**\n\n`;
            }

            if (op.description) {
                md += `${op.description.trim()}\n\n`;
            }

            if (op.security && op.security.length > 0) {
                const hasBearer = op.security.some(s => s.bearerAuth !== undefined);
                if (hasBearer) {
                    md += '> Yeu cau xac thuc: `Bearer Token`\n\n';
                }
            }

            if (op.parameters && op.parameters.length > 0) {
                md += '**Parameters:**\n';
                md += renderParams(op.parameters);
                md += '\n';
            }

            if (op.requestBody) {
                md += renderRequestBody(op.requestBody);
                md += '\n';
            }

            if (op.responses) {
                md += renderResponses(op.responses);
            }

            md += '\n---\n\n';
        }
    }

    return md;
}

try {
    const jsonPath = path.join(DOCS_DIR, 'swagger.json');
    fs.writeFileSync(jsonPath, JSON.stringify(swaggerSpec, null, 2), 'utf8');
    console.log('[OK] docs/swagger.json');

    const yamlPath = path.join(DOCS_DIR, 'swagger.yaml');
    fs.writeFileSync(yamlPath, yaml.dump(swaggerSpec), 'utf8');
    console.log('[OK] docs/swagger.yaml');

    const mdPath = path.join(DOCS_DIR, 'api-docs.md');
    const mdContent = generateMarkdown(swaggerSpec);
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    console.log('[OK] docs/api-docs.md (' + mdContent.length + ' chars)');

    if (fs.existsSync(path.dirname(POSTMAN_PATH))) {
        Converter.convert({ type: 'json', data: swaggerSpec }, {
            folderStrategy: 'Tags',
            requestParametersResolution: 'Schema',
            exampleParametersResolution: 'Example',
            includeWebhooks: false
        }, (err, result) => {
            if (err) {
                console.error('[ERR] Postman:', err);
            } else if (result.result) {
                const collection = result.output[0].data;
                collection.info.name = 'Junkio Expense Tracker API';
                fs.writeFileSync(POSTMAN_PATH, JSON.stringify(collection, null, 2), 'utf8');
                console.log('[OK] docx/07-tham-chieu/postman/Junkio.postman_collection.json');
            } else {
                console.error('[ERR] Postman convert failed:', result.reason);
            }
        });
    }

} catch (e) {
    console.error('[ERR]', e);
    process.exit(1);
}
