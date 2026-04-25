import prisma from "../config/prisma.js";

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeNotes = (notes) => {
  if (Array.isArray(notes)) {
    return notes.map((note) => String(note).trim()).filter(Boolean);
  }

  if (typeof notes === "string") {
    return notes
      .split(",")
      .map((note) => note.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeTextArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildGallery = (product) => {
  const seen = new Set();
  const images = [product.image, product.secondaryImage, product.thirdImage];
  const extras = Array.isArray(product.gallery) ? product.gallery : [];

  return [...images, ...extras]
    .map((item) => String(item || "").trim())
    .filter((item) => {
      if (!item || seen.has(item)) {
        return false;
      }

      seen.add(item);
      return true;
    });
};

const serializeProduct = (product) => ({
  ...product,
  price: Number(product.price),
  weight: String(product.weight || "").trim(),
  secondaryImage: String(product.secondaryImage || "").trim(),
  thirdImage: String(product.thirdImage || "").trim(),
  notes: Array.isArray(product.notes) ? product.notes : [],
  gallery: buildGallery(product),
  benefits: Array.isArray(product.benefits) ? product.benefits : [],
});

const serializeProductSummary = (product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  shortDescription: product.shortDescription,
  price: Number(product.price),
  image: product.image,
  weight: String(product.weight || "").trim(),
  tag: product.tag || null,
  roast: product.roast || null,
  stock: product.stock,
  featured: Boolean(product.featured),
  isActive: product.isActive !== false,
});

const buildProductData = (payload) => {
  const weight = String(payload.weight || "250g").trim();
  const slug = slugify(payload.slug || [payload.name, weight].filter(Boolean).join(" "));
  const price = Number(payload.price);
  const image = String(payload.image || "").trim();
  const secondaryImage = String(payload.secondaryImage || "").trim();
  const thirdImage = String(payload.thirdImage || "").trim();
  const gallery = normalizeTextArray(payload.gallery).filter(
    (item) => item !== image && item !== secondaryImage && item !== thirdImage
  );

  return {
    slug,
    name: String(payload.name || "").trim(),
    shortDescription: String(payload.shortDescription || "").trim(),
    longDescription: String(payload.longDescription || "").trim() || null,
    weight: weight || null,
    price: Number.isFinite(price) ? price : 0,
    image,
    secondaryImage: secondaryImage || null,
    thirdImage: thirdImage || null,
    gallery,
    benefits: normalizeTextArray(payload.benefits),
    tag: String(payload.tag || "").trim() || null,
    notes: normalizeNotes(payload.notes),
    roast: String(payload.roast || "").trim() || null,
    origin: String(payload.origin || "").trim() || null,
    process: String(payload.process || "").trim() || null,
    stock: Number.isFinite(Number(payload.stock)) ? Math.max(0, Number(payload.stock)) : 0,
    featured: Boolean(payload.featured),
    isActive: payload.isActive !== false,
  };
};

const validateProductData = (product) => {
  if (!product.slug || !product.name || !product.weight || !product.shortDescription || !product.image) {
    return "Slug, name, weight, short description, and image are required.";
  }

  if (product.price <= 0) {
    return "Price must be greater than 0.";
  }

  if (product.stock < 0) {
    return "Stock cannot be negative.";
  }

  return null;
};

export const listProducts = async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: "asc" }],
    });

    res.json({ success: true, products: products.map(serializeProductSummary) });
  } catch (error) {
    console.error("List products error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const listAdminProducts = async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ updatedAt: "desc" }],
    });

    res.json({ success: true, products: products.map(serializeProduct) });
  } catch (error) {
    console.error("List admin products error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found.", success: false });
    }

    res.json({ success: true, product: serializeProduct(product) });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const createProduct = async (req, res) => {
  try {
    const data = buildProductData(req.body);
    const validationError = validateProductData(data);

    if (validationError) {
      return res.status(400).json({ message: validationError, success: false });
    }

    const product = await prisma.product.create({ data });

    res.status(201).json({ success: true, product: serializeProduct(product) });
  } catch (error) {
    console.error("Create product error:", error);
    const message = error.code === "P2002" ? "Slug already exists." : "Server error";
    res.status(message === "Server error" ? 500 : 400).json({ message, success: false });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found.", success: false });
    }

    const data = buildProductData(req.body);
    const validationError = validateProductData(data);

    if (validationError) {
      return res.status(400).json({ message: validationError, success: false });
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data,
    });

    res.json({ success: true, product: serializeProduct(updated) });
  } catch (error) {
    console.error("Update product error:", error);
    const message = error.code === "P2002" ? "Slug already exists." : "Server error";
    res.status(message === "Server error" ? 500 : 400).json({ message, success: false });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found.", success: false });
    }

    await prisma.product.delete({
      where: { id: product.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
