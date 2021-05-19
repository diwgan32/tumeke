import re
from setuptools import setup, find_packages

# Load version from module (without loading the whole module)
with open('src/pytumeke/__init__.py', 'r') as fo:
    version = re.search(r'^__version__\s*=\s*[\'"]([^\'"]*)[\'"]',
                        fo.read(), re.MULTILINE).group(1)

# Read in the README.md for the long description.
with open('README.md') as fo:
    content = fo.read()
    long_description = content
    description = "Helpers for TuMeke python interface"

setup(
    name='pytumeke',
    version=version,
    url='https://github.com/diwgan32/tumeke',
    author='Diwakar Ganesan',
    author_email='diwakar@tumeke.io',
    description=description,
    long_description=long_description,
    long_description_content_type="text/markdown",
    license='GPLv3+',
    packages=find_packages(where='src'),
    package_data={
        "pytumeke": ["config/*.json"]
    },
    package_dir={'': 'src'},
    test_suite='',
    install_requires=[],
    keywords='',
    classifiers=[
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.4',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
    ],
)