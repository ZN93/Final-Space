export interface NavigationItem {
  label: string;
  description: string;
  route: string;
  icon: string;
  exact?: boolean;
  adminOnly?: boolean;
}
