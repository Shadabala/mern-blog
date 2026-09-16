
import { Box, styled, Typography, Link } from '@mui/material';
import { Email } from '@mui/icons-material';
import { useTranslation } from '../../i18n/i18n';

const Banner = styled(Box)`
    background-image: url('/blog.png');
    width: 100%;
    height: 50vh;
    background-position: left 0px bottom 0px;
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

const About = () => {
    const { t } = useTranslation();

    return (
        <Box>
            <Banner />
            <Wrapper>
                <Typography variant="h3">{t("about.welcome")}</Typography>
                <Text variant="h5">{t("about.title")}<br />
                </Text>
                <Text variant="h5">
                    {t("about.subtitle")}
                    <br />
                    <Link href="mailto:my.shadabalam@gmail.com?Subject=This is a subject" target="_blank" color="inherit">
                        <Email />
                    </Link>
                </Text>
            </Wrapper>
        </Box>
    )
}

export default About;