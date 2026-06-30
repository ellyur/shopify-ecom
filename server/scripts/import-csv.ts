
  import { db } from "../db";
  import { products, categories } from "../../shared/schema";
  import fs from "fs";
  import path from "path";
  import { fileURLToPath } from "url";

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  async function importCsv() {
    const csvFilePath = path.resolve(__dirname, "../../products.csv");
    if (!fs.existsSync(csvFilePath)) {
      console.error("products.csv not found in root directory");
      process.exit(1);
    }

    const fileContent = fs.readFileSync(csvFilePath, "utf-8");
    const lines = fileContent.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(",").map(h => h.trim());
    const records = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const record: any = {};
      headers.forEach((header, i) => {
        record[header] = values[i];
      });
      return record;
    });

    console.log(`Found ${records.length} records in CSV`);

    for (const record of records) {
      try {
        // Find or create category
        let category = await db.query.categories.findFirst({
          where: (categories, { eq }) => eq(categories.name, record.category),
        });

        if (!category) {
          [category] = await db.insert(categories).values({
            name: record.category,
            slug: record.category.toLowerCase().replace(/\s+/g, "-"),
          }).returning();
          console.log(`Created category: ${category.name}`);
        }

        // Insert product
        const productValues = {
          name: record.name,
          slug: (record.name || "").toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(36).substring(2, 7),
          categoryId: category.id,
          price: record.price.toString(),
          stock: parseInt(record.stock) || 0,
          description: record.description || "",
          images: record.image ? [record.image] : [],
          badges: record.badges ? record.badges.split(",").map((b: string) => b.trim()) : [],
          sku: record.sku || `SKU-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        };
        await db.insert(products).values(productValues);
        console.log(`Imported product: ${record.name}`);
      } catch (err) {
        console.error(`Failed to import ${record.name}:`, err);
      }
    }

    console.log("Import completed successfully");
    process.exit(0);
  }

  importCsv().catch(console.error);
  