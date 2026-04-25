// CSS side-effect import declarations (for global CSS like globals.css)
declare module "*.css";

// CSS module declarations (for *.module.css files)
declare module "*.module.css" {
  const content: { [className: string]: string };
  export default content;
}

// SCSS/SASS side-effect imports
declare module "*.scss";
declare module "*.sass";

// SCSS/SASS module declarations
declare module "*.module.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.module.sass" {
  const content: { [className: string]: string };
  export default content;
}

// Image declarations
declare module "*.svg" {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}
