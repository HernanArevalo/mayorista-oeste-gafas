export const PROVINCES = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export type DeliveryMethod = "RETIRO_LOCAL" | "CADETE" | "CORREO_ARGENTINO";

export const PICKUP_ADDRESS = "Ituzaingó 610, Córdoba Capital";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const CAPITAL_ALIASES = [
  "cordoba",
  "cordoba capital",
  "cordoba ciudad",
  "ciudad de cordoba",
  "cba",
  "cba capital",
  "capital",
];

/** Córdoba Capital: provincia Córdoba + (casilla marcada o ciudad que coincide). */
export function isCordobaCapital(province: string, city: string, flag = false) {
  if (province !== "Córdoba") return false;
  return flag || CAPITAL_ALIASES.includes(norm(city));
}

export function deliveryOptions(isCapital: boolean): DeliveryMethod[] {
  return isCapital ? ["RETIRO_LOCAL", "CADETE", "CORREO_ARGENTINO"] : ["CORREO_ARGENTINO"];
}

/** Texto largo para el selector del checkout. */
export function deliveryOptionLabel(method: DeliveryMethod, isCapital: boolean) {
  switch (method) {
    case "RETIRO_LOCAL":
      return `Retiro a coordinar en ${PICKUP_ADDRESS}`;
    case "CADETE":
      return "Envío por Cadete (Cba Capital - costo a coordinar por WhatsApp)";
    case "CORREO_ARGENTINO":
      return isCapital
        ? "Correo Argentino (costo a coordinar por WhatsApp)"
        : "Correo Argentino (envío a todo el país - costo a coordinar por WhatsApp)";
  }
}

/** Texto corto para el mensaje de WhatsApp. */
export const DELIVERY_SHORT_LABEL: Record<DeliveryMethod, string> = {
  RETIRO_LOCAL: "Retiro a coordinar",
  CADETE: "Cadete (Cba Capital)",
  CORREO_ARGENTINO: "Correo Argentino",
};
