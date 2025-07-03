import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { createTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { DemoProvider, useDemoRouter } from '@toolpad/core/internal';
import Users from './Users';
import { useNavigate } from 'react-router-dom';

const NAVIGATION = [
    {
        segment: 'user',
        title: 'Users',
    },
];

const demoTheme = createTheme({
    colorSchemes: { light: true },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 600,
            lg: 1200,
            xl: 1536,
        },
    },
});

function DemoPageContent({ pathname }) {

    return (
        <Box
            sx={{
                py: 4,
                px: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                minHeight: '100vh',
                boxSizing: 'border-box',
                justifyContent: 'space-between'
            }}
        >
            <Box>
                <Users />
            </Box>
        </Box>
    );
}

DemoPageContent.propTypes = {
    pathname: PropTypes.string.isRequired,
};

function DashboardLayoutBasic(props) {
    const { window } = props;
    const navigate = useNavigate();


    const router = useDemoRouter('/dashboard');

    const demoWindow = window !== undefined ? window() : undefined;

    return (
        <DemoProvider window={demoWindow}>
            <AppProvider
                navigation={NAVIGATION}
                branding={{
                    logo: <img
                        src="https://www.gstatic.com/meet/google_meet_horizontal_wordmark_2020q4_2x_icon_124_40_292e71bcb52a56e2a9005164118f183b.png"
                        alt="Google Meet Logo"
                        onClick={() => navigate('/')}
                    />,
                    title: ''
                }}
                router={router}
                theme={demoTheme}
                window={demoWindow}
            >
                <DashboardLayout>
                    <DemoPageContent pathname={router.pathname} />
                </DashboardLayout>
            </AppProvider>
        </DemoProvider>
    );
}

DashboardLayoutBasic.propTypes = {
};

export default DashboardLayoutBasic;
