import { ArrowRight, House, Globe, Boxes, FileText, Menu, ArrowUpRight, Mail } from 'lucide-react';

const websitePages = [
  ['home', 'Home', 'Opening image, introduction and artist promotion', House],
  ['about', 'Who we are', 'The label story, contacts and people', Globe],
  ['services', 'Services', 'What the label offers and how to get in touch', Mail],
  ['distro_page', 'Distro introduction', 'Introduction and format descriptions', Boxes],
  ['purchase_information', 'Buying & delivery', 'Purchase terms, delivery and privacy', FileText],
] as const;
const footerPages = [
  ['navigation', 'Navigation', 'Links at the top and bottom of the website', Menu],
  ['socials', 'Social links', 'Where listeners can follow the label', ArrowUpRight],
  ['newsletter', 'Newsletter', 'Signup heading, button and supporting text', Mail],
] as const;

export default function WebsitePages({ footer = false }: { footer?: boolean }) {
  return (
    <section className="staff-page">
      <h1>{footer ? 'Navigation & footer' : 'Pages'}</h1>
      <div className="staff-destinations">
        {(footer ? footerPages : websitePages).map(([collection, name, description, Icon]) => (
          <a key={collection} href={`/content/?collection=${collection}`}>
            <div>
              <strong className="flex items-center gap-2">
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {name}
              </strong>
              <p>{description}</p>
            </div>
            <ArrowRight aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}
