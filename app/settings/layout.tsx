import SidebarNav from "@/components/settings/SidebarNav"

interface SettingsLayoutProps {
  children: React.ReactNode
}

// レイアウト
const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <div className="flex flex-col space-y-8 md:flex-row md:space-x-12 md:space-y-0">
      <div className="md:w-1/4">
        <SidebarNav />
      </div>
      <div className="flex-1 md:max-w-2xl">{children}</div>
    </div>
  )
}

export default SettingsLayout
