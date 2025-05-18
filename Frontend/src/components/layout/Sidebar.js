import React from 'react';
import { 
  Drawer,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Toolbar,
  Collapse,
  useTheme
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DnsIcon from '@mui/icons-material/Dns';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import CodeIcon from '@mui/icons-material/Code';
import HttpsIcon from '@mui/icons-material/Https';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import LanguageIcon from '@mui/icons-material/Language';
import BugReportIcon from '@mui/icons-material/BugReport';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAdmin } = useAuth();
  
  const [scanMenuOpen, setScanMenuOpen] = React.useState(false);
  
  const handleScanMenuToggle = () => {
    setScanMenuOpen(!scanMenuOpen);
  };
  
  // Define menu items
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Profile',
      icon: <PersonIcon />,
      path: '/profile',
    },
    {
      text: 'API Keys',
      icon: <VpnKeyIcon />,
      path: '/api-keys',
    },
  ];
  
  // Scan tools submenu
  const scanTools = [
    { text: 'All Tools', icon: <SecurityIcon />, path: '/scan' },
    { text: 'DNS Lookup (dig)', icon: <DnsIcon />, path: '/scan/dig' },
    { text: 'Network Scan (nmap)', icon: <NetworkCheckIcon />, path: '/scan/nmap' },
    { text: 'Web Tech (whatweb)', icon: <CodeIcon />, path: '/scan/whatweb' },
    { text: 'SSL/TLS Scan (sslscan)', icon: <HttpsIcon />, path: '/scan/sslscan' },
    { text: 'Subdomain Finder', icon: <FindInPageIcon />, path: '/scan/subfinder' },
    { text: 'WordPress Scan', icon: <LanguageIcon />, path: '/scan/wpscan' },
    { text: 'Vulnerability Scan', icon: <BugReportIcon />, path: '/scan/nuclei' },
  ];
  
  // Create responsive drawer content
  const drawerContent = (
    <div>
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              key={item.text} 
              disablePadding
            >
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
          
          <ListItem disablePadding>
            <ListItemButton onClick={handleScanMenuToggle}>
              <ListItemIcon>
                <SearchIcon />
              </ListItemIcon>
              <ListItemText primary="Security Scans" />
              {scanMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
          </ListItem>
          
          <Collapse in={scanMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {scanTools.map((tool) => (
                <ListItemButton
                  key={tool.text}
                  sx={{ pl: 4 }}
                  selected={location.pathname === tool.path}
                  onClick={() => navigate(tool.path)}
                >
                  <ListItemIcon>{tool.icon}</ListItemIcon>
                  <ListItemText primary={tool.text} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
          
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/history'}
              onClick={() => navigate('/history')}
            >
              <ListItemIcon><HistoryIcon /></ListItemIcon>
              <ListItemText primary="Scan History" />
            </ListItemButton>
          </ListItem>
          
          {isAdmin() && (
            <>
              <Divider />
              <ListItem disablePadding>
                <ListItemButton
                  selected={location.pathname === '/admin'}
                  onClick={() => navigate('/admin')}
                >
                  <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
                  <ListItemText primary="Admin Panel" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
