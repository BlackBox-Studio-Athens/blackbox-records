import { FileText, ImageIcon, Library, Settings2, X } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar';
import { Button } from '../ui/button';
import { contentSections, type ContentSection } from './ContentFields';

const groups: { title: string; sections: ContentSection[]; icon: typeof FileText }[] = [
  { title: 'Collections', sections: ['artists', 'releases', 'distro', 'news'], icon: Library },
  { title: 'Pages', sections: ['home', 'about', 'services', 'distro_page', 'purchase_information'], icon: FileText },
  { title: 'Site settings', sections: ['newsletter', 'navigation', 'socials', 'settings'], icon: Settings2 },
];

export default function ContentNavigation({
  collection,
  media,
  disabled,
  onCollection,
  onMedia,
}: {
  collection: ContentSection;
  media: boolean;
  disabled: boolean;
  onCollection(section: ContentSection): void;
  onMedia(): void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar className="cms-sidebar">
      <SidebarHeader className="flex-row items-center justify-between border-b border-border px-4 py-5">
        <span className="text-sm font-semibold">Content studio</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpenMobile(false)}
        >
          <X className="size-4" />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.sections.map((section) => (
                  <SidebarMenuItem key={section}>
                    <SidebarMenuButton
                      type="button"
                      isActive={!media && collection === section}
                      aria-current={!media && collection === section ? 'page' : undefined}
                      disabled={disabled}
                      onClick={() => {
                        onCollection(section);
                        setOpenMobile(false);
                      }}
                      className="min-h-11"
                    >
                      <group.icon className="size-4" aria-hidden="true" />
                      <span>{contentSections[section]}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  isActive={media}
                  aria-current={media ? 'page' : undefined}
                  disabled={disabled}
                  className="min-h-11"
                  onClick={() => {
                    onMedia();
                    setOpenMobile(false);
                  }}
                >
                  <ImageIcon className="size-4" aria-hidden="true" />
                  <span>Media</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-4 text-xs leading-relaxed text-muted-foreground">
        Drafts stay private until publication is live.
      </SidebarFooter>
    </Sidebar>
  );
}
