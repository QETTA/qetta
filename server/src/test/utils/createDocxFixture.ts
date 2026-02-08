import PizZip from 'pizzip';
import fs from 'fs/promises';
import path from 'path';

export async function createSimpleDocx(pathToWrite: string, placeholder = 'company_name') {
  const zip = new PizZip();
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    <w:p><w:r><w:t>{{${placeholder}}}</w:t></w:r></w:p>\n  </w:body>\n</w:document>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

  zip.file('[Content_Types].xml', contentTypes);
  zip.folder('_rels')!.file('.rels', rels);
  zip.folder('word')!.file('document.xml', docXml);

  const buf = zip.generate({ type: 'nodebuffer' });
  await fs.mkdir(path.dirname(pathToWrite), { recursive: true });
  await fs.writeFile(pathToWrite, buf);
}
