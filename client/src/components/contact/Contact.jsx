
import { Box, styled, Typography, Link } from '@mui/material';
import { Email, Phone } from '@mui/icons-material';
import { useTranslation } from '../../i18n/i18n';

const Banner = styled(Box)`
    background-image: url('/blog.png');
    width: 100%;
    height: 50vh;
    background-position: left 0px top -100px;
    background-size: cover;
`;

const Wrapper = styled(Box)`
    padding: 20px;
    & > h3, & > h5 {
        margin-top: 50px;
    }
`;

const Text = styled(Typography)`
    color: #878787;
`;


const Contact = () => {
    const { t } = useTranslation();
    return (
        <Box>
            <Banner />
            <Wrapper>
                <Typography variant="h3">{t("contact.welcome")}</Typography>
                <Text variant="h5">
                    {t("contact.subtitle")}
                    <br />
                    <Link href="tel:+919807770015" color="inherit">
                        <Phone />
                    </Link>
                    <Link href="mailto:my.shadabalam@gmail.com?Subject=This is a subject" target="_blank" color="inherit" style={{ marginLeft: 8 }}>
                        <Email />
                    </Link>
                </Text>
            </Wrapper>
        </Box>
    );
}

export default Contact;