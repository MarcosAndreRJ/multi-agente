import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

export async function processExportTags(text: string): Promise<string> {
    const pdfRegex = /<export_pdf>([\s\S]*?)<\/export_pdf>/gi;
    const xlsxRegex = /<export_xlsx>([\s\S]*?)<\/export_xlsx>/gi;

    let modifiedText = text;
    const outputDir = path.resolve("public", "downloads");

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let match;
    while ((match = pdfRegex.exec(text)) !== null) {
        const content = match[1].trim();
        const filename = `export_${Date.now()}_${Math.floor(Math.random() * 1000)}.pdf`;
        const filepath = path.join(outputDir, filename);

        await new Promise<void>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);
            doc.fontSize(12).text(content, { align: 'left' });
            doc.end();
            stream.on("finish", resolve);
            stream.on("error", reject);
        });

        const link = `\n\n[📄 **Baixar Documento (PDF)**](/public/downloads/${filename})\n\n`;
        modifiedText = modifiedText.replace(match[0], link);
    }

    while ((match = xlsxRegex.exec(text)) !== null) {
        const content = match[1].trim();
        const filename = `export_${Date.now()}_${Math.floor(Math.random() * 1000)}.xlsx`;
        const filepath = path.join(outputDir, filename);

        try {
            let data = JSON.parse(content);
            if (!Array.isArray(data) && typeof data === 'object') {
                data = Object.keys(data).length > 0 ? [data] : [];
            }
            if (Array.isArray(data)) {
                const workbook = new ExcelJS.Workbook();
                const sheet = workbook.addWorksheet('Planilha');
                
                if (data.length > 0) {
                     // Automatically detect headers from first object
                    const columns = Object.keys(data[0]).map(k => ({ header: k, key: k, width: 20 }));
                    sheet.columns = columns;
                    data.forEach(row => sheet.addRow(row));
                } else {
                    sheet.addRow(["Nenhum dado encontrado"]);
                }

                await workbook.xlsx.writeFile(filepath);
                const link = `\n\n[📊 **Baixar Planilha (Excel)**](/public/downloads/${filename})\n\n`;
                modifiedText = modifiedText.replace(match[0], link);
            } else {
                modifiedText = modifiedText.replace(match[0], "\n⚠️ *[Erro: Estrutura JSON inválida para montar a planilha]*\n");
            }
        } catch (e) {
            modifiedText = modifiedText.replace(match[0], "\n⚠️ *[Erro: Falha ao parsear o JSON para a planilha. O agente enviou um dado malformado!]*\n");
        }
    }

    return modifiedText;
}
