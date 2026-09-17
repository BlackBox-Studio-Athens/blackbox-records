import { ArrowRight } from 'lucide-react';

const websitePages = [
  ['home', 'Home', 'Opening image, introduction and artist promotion'],
  ['about', 'About', 'The label story, contacts and people'],
  ['services', 'Services', 'What the label offers and how to get in touch'],
  ['distro_page', 'Distro introduction', 'Introduction and format descriptions'],
  ['purchase_information', 'Buying & delivery', 'Purchase terms, delivery and privacy'],
] as const;
const footerPages = [
  ['navigation', 'Navigation', 'Links at the top and bottom of the website'],
  ['socials', 'Social links', 'Where listeners can follow the label'],
  ['newsletter', 'Newsletter', 'Signup heading, button and supporting text'],
] as const;

export default function WebsitePages({ footer = false }: { footer?: boolean }) {
  return (
    <section className="staff-page">
      <h1>{footer ? 'Navigation & footer' : 'Pages'}</h1>
      <div className="staff-destinations">
        {(footer ? footerPages : websitePages).map(([collection, name, description]) => (
          <a key={collection} href={`/content/?collection=${collection}`}>
            <div>
              <strong>{name}</strong>
              <p>{description}</p>
            </div>
            <ArrowRight aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
